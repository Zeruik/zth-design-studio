'use strict';
const $=id=>document.getElementById(id), F=fabric;
// Keep v1/v2 template coordinates stable under Fabric 7's new center origins.
F.FabricObject.ownDefaults.originX='left';F.FabricObject.ownDefaults.originY='top';
// Adapted from Fabric 7.4's MIT-licensed extensions/data_updaters/gradient.
// Restore older projects whose gradient stops stored opacity separately.
const gradientFromObject=F.Gradient.fromObject;
F.Gradient.fromObject=async function(serialized){
 const colorStops=serialized.colorStops?.map(({color,opacity,offset})=>({
  color:opacity===undefined||opacity===1?color:new F.Color(color).setAlpha(opacity).toRgba(),offset
 }));
 return gradientFromObject.call(this,{...serialized,colorStops});
};
F.FabricObject.customProperties=['name','role','locked','qrText','qrDark','qrLight','keepRatio','imageSlot'];
F.FabricObject.prototype.set({transparentCorners:false,cornerColor:'#7652d8',cornerStrokeColor:'#ffffff',borderColor:'#7652d8',cornerSize:11,padding:3});
const canvas=new F.Canvas('canvas',{preserveObjectStacking:true,selection:true,backgroundColor:'#f7f3eb',fireRightClick:false,fireMiddleClick:false,stopContextMenu:false});
let polygonPoints=[],polygonPreview=null,drawingPolygon=false;
let width=1080,height=1440,zoom=.4,busy=false,history=[],historyIndex=-1,saveTimer,toastTimer,activeTab='templates',category='全部',query='',uploads=[],pages=[],pageIndex=0,layoutVariant=0;
let portableFont='',workId=crypto.randomUUID(),switching=false,layerMultiSelect=false;
const thumbs=new Map();const database=new Promise((resolve,reject)=>{let r=indexedDB.open('zth-design-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function dbPut(k,v){let db=await database;return new Promise((resolve,reject)=>{let t=db.transaction('files','readwrite');t.objectStore('files').put(v,k);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
async function dbGet(k){let db=await database;return new Promise((resolve,reject)=>{let r=db.transaction('files').objectStore('files').get(k);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function dbAtomic(keys,update){
 const db=await database;
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),values={};let remaining=keys.length,result,failed;
  const apply=()=>{try{const plan=update(values)||{};for(const [key,value]of plan.puts||[])store.put(value,key);for(const key of plan.deletes||[])store.delete(key);result=plan.value;}catch(error){failed=error;tx.abort();}};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(failed||tx.error);tx.onabort=()=>reject(failed||tx.error||Error('保存事务已取消'));
  if(!remaining)apply();else for(const key of keys){const request=store.get(key);request.onsuccess=()=>{values[key]=request.result;if(--remaining===0)apply();};}
 });
}
function cancelAutosave(){clearTimeout(saveTimer);saveTimer=undefined;}
function scheduleAutosave(){
 cancelAutosave();const owner=workId;
 saveTimer=setTimeout(async()=>{if(busy||owner!==workId)return;try{const result=window.ZTH_WORKS?await ZTH_WORKS.save():await dbPut('autosave',project());if(owner===workId)$('saveStatus').textContent=result?.skipped?'作品已在其他窗口更新 · 请重新打开或导出备份':'已自动保存到此设备';}catch(e){$('saveStatus').textContent='自动保存失败 · 请保存作品备份';}},600);
}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function snapshot(){return {width,height,canvas:canvas.toObject()};}
function currentIntoPages(){pages[pageIndex]={...snapshot(),name:pages[pageIndex]?.name||'页面 '+(pageIndex+1)};}
function project(){currentIntoPages();return {format:'zthpmsj',schema:1,appVersion:'4.0.0',workId,name:$('projectName').value,fonts:window.ZTH_FONTS?ZTH_FONTS.collectUsed(pages):(portableFont?[{family:'ZTH Sans',src:portableFont}]:[]),pages,activePage:pageIndex,savedAt:new Date().toISOString()};}
// History stores the whole document, with shared image payloads kept only once.
const HISTORY_LIMIT=50,HISTORY_BYTES=48*1024*1024,historyListeners=new Set(),historyAssets=new Map(),historyAssetValues=new Map(),objectKeys=new WeakMap();
let historyMeta=[],assetSequence=0,objectSequence=0,mergeBoundary=0,operationTail=Promise.resolve(),operationCount=0,documentEpoch=0,canvasGeneration=0;
function objectKey(o){if(!objectKeys.has(o))objectKeys.set(o,++objectSequence);return objectKeys.get(o);}
function breakHistoryMerge(){++mergeBoundary;}
function documentState(){currentIntoPages();return {name:$('projectName').value,pages,activePage:pageIndex};}
function encodeHistory(state){
 const assets=new Set();const json=JSON.stringify(state,(_key,value)=>{
  if(typeof value!=='string'||value.length<256||!value.startsWith('data:'))return value;
  let key=historyAssetValues.get(value);if(!key){key='asset-'+(++assetSequence);historyAssetValues.set(value,key);historyAssets.set(key,value);}assets.add(key);return {__zthHistoryAsset:key};
 });return {json,assets:[...assets],bytes:json.length*2};
}
function decodeHistory(json){return JSON.parse(json,(_key,value)=>value&&typeof value==='object'&&Object.keys(value).length===1&&value.__zthHistoryAsset?historyAssets.get(value.__zthHistoryAsset):value);}
function collectHistoryAssets(){const used=new Set(historyMeta.flatMap(item=>item.assets));for(const [key,value]of historyAssets)if(!used.has(key)){historyAssets.delete(key);historyAssetValues.delete(value);}}
function historyBytes(){return historyMeta.reduce((n,item)=>n+item.bytes,0)+[...historyAssets.values()].reduce((n,value)=>n+value.length*2,0);}
function getHistory(){return {entries:historyMeta.map((item,index)=>({id:item.id,label:item.label,at:item.at,pageIndex:item.pageIndex,pageCount:item.pageCount,current:index===historyIndex})),index:historyIndex,canUndo:historyIndex>0,canRedo:historyIndex<history.length-1,busy:busy||switching||operationCount>0,bytes:historyBytes(),limit:HISTORY_LIMIT,byteLimit:HISTORY_BYTES};}
function notifyHistory(){const state=getHistory();$('undoBtn').disabled=!state.canUndo||state.busy;$('redoBtn').disabled=!state.canRedo||state.busy;for(const listener of historyListeners){try{listener(state);}catch(error){console.error('History listener failed',error);}}}
function subscribeHistory(listener){historyListeners.add(listener);listener(getHistory());return()=>historyListeners.delete(listener);}
function inferAction(previous,next){
 if(!previous)return '开始编辑';if(previous.name!==next.name)return '重命名作品';
 if(previous.pages.length!==next.pages.length)return previous.pages.length<next.pages.length?'添加页面':'删除页面';
 const before=previous.pages[next.activePage],after=next.pages[next.activePage];if(!before)return '编辑页面';
 if(before.width!==after.width||before.height!==after.height)return '调整画布尺寸';
 if(JSON.stringify(before.canvas.background)!==JSON.stringify(after.canvas.background))return '修改背景';
 const old=before.canvas.objects||[],now=after.canvas.objects||[];
 if(old.length!==now.length)return old.length<now.length?'添加元素':'删除元素';
 if(old.some((o,i)=>o.locked!==now[i]?.locked))return '锁定 / 解锁';
 if(old.some((o,i)=>o.text!==now[i]?.text))return '编辑文字';
 return '调整元素';
}
function changed(label,options={}){
 if(busy)return;const state=documentState(),encoded=encodeHistory(state),previous=history[historyIndex]?JSON.parse(history[historyIndex]):null;
 if(previous)previous.activePage=state.activePage;
 if(!previous||JSON.stringify(previous)!==encoded.json){
  const now=Date.now(),mergeKey=options.mergeKey?mergeBoundary+':'+options.mergeKey:null,prior=historyMeta[historyIndex];
  const merge=mergeKey&&historyIndex>0&&historyIndex===history.length-1&&prior?.mergeKey===mergeKey&&now-prior.time<900;
  const meta={id:merge?prior.id:crypto.randomUUID(),label:typeof label==='string'?label:inferAction(previous,JSON.parse(encoded.json)),at:new Date(now).toISOString(),time:now,mergeKey,pageIndex,pageCount:pages.length,assets:encoded.assets,bytes:encoded.bytes};
  if(merge){history[historyIndex]=encoded.json;historyMeta[historyIndex]=meta;}
  else{history=history.slice(0,historyIndex+1);historyMeta=historyMeta.slice(0,historyIndex+1);history.push(encoded.json);historyMeta.push(meta);historyIndex=history.length-1;}
  collectHistoryAssets();while(history.length>1&&(history.length>HISTORY_LIMIT||historyBytes()>HISTORY_BYTES)){history.shift();historyMeta.shift();--historyIndex;collectHistoryAssets();}
 }else collectHistoryAssets();
 renderLayers();syncProps();notifyHistory();$('saveStatus').textContent='有修改 · 正在保存';scheduleAutosave();
}
function resetHistory(label='开始编辑'){history=[];historyMeta=[];historyIndex=-1;historyAssets.clear();historyAssetValues.clear();breakHistoryMerge();changed(label);}
function editingBlocked(){return busy||switching||operationCount>0;}
function runCanvasOperation(task,epoch=documentEpoch){
 if(!operationCount){cancelPolygon();canvas.discardActiveObject();canvas.selection=false;canvas.skipTargetFind=true;}
 ++operationCount;++canvasGeneration;cancelAutosave();breakHistoryMerge();notifyHistory();
 const result=operationTail.then(async()=>{if(epoch!==documentEpoch)return false;return task();});
 operationTail=result.catch(()=>{});
 return result.finally(()=>{--operationCount;if(!operationCount){canvas.selection=true;canvas.skipTargetFind=false;}notifyHistory();});
}
async function hydrate(s){busy=true;const renderOnAddRemove=canvas.renderOnAddRemove;canvas.discardActiveObject();try{await canvas.loadFromJSON(s.canvas);const restore=o=>{if(o.locked)setLocked(o,true);o.getObjects?.().forEach(restore);};canvas.getObjects().forEach(restore);width=s.width;height=s.height;fit();canvas.requestRenderAll();syncProps();renderLayers();}finally{canvas.renderOnAddRemove=renderOnAddRemove;busy=false;}}
async function restoreHistory(index){
 if(index<0||index>=history.length||index===historyIndex)return false;
 const state=decodeHistory(history[index]),nextIndex=Math.max(0,Math.min(state.activePage,state.pages.length-1));
 await hydrate(state.pages[nextIndex]);pages=state.pages;pageIndex=nextIndex;$('projectName').value=state.name;historyIndex=index;
 updateHistory();renderPages();return true;
}
function undo(){if(switching)return Promise.resolve(false);return runCanvasOperation(()=>restoreHistory(historyIndex-1));}
function redo(){if(switching)return Promise.resolve(false);return runCanvasOperation(()=>restoreHistory(historyIndex+1));}
function goToHistory(id){if(switching)return Promise.resolve(false);return runCanvasOperation(()=>restoreHistory(historyMeta.findIndex(item=>item.id===id)));}
function updateHistory(){renderLayers();syncProps();notifyHistory();scheduleAutosave();}
function setZoom(z){zoom=Math.min(2,Math.max(.025,z));canvas.setDimensions({width:Math.round(width*zoom),height:Math.round(height*zoom)});canvas.setZoom(zoom);$('zoomLabel').textContent=Math.round(zoom*100)+'%';$('docSize').textContent=width+' × '+height+' px';}
function fit(){let stage=$('stage');setZoom(Math.min((stage.clientWidth-64)/width,(stage.clientHeight-64)/height,1));}
function val(id,fallback=0){const n=Number($(id).value);return Number.isFinite(n)?n:fallback;}
function selected(){return canvas.getActiveObject();}
function add(o,label='添加元素'){if(editingBlocked())return null;canvas.add(o);canvas.setActiveObject(o);canvas.requestRenderAll();changed(label);return o;}
function text(value='双击输入文字',size=72){return add(new F.Textbox(value,{left:width*.1,top:height*.3,width:width*.8,splitByGrapheme:true,fontSize:size,fontFamily:'ZTH Sans',fill:'#272333',name:'文字',role:size>=60?'title':'body'}));}
function colorValue(c,fallback='#000000'){return typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c:fallback;}
function syncProps(){window.ZTH_SELECTION?.refresh();let o=selected();$('fields').hidden=!o;$('selectHint').hidden=!!o;$('selectionType').textContent=o?(o.type==='image'?'图片':o.type==='textbox'?'文字':'元素'):'画布';$('bgColor').value=colorValue(canvas.backgroundColor,'#ffffff');if(!o)return;for(const [id,n]of [['posX',o.left],['posY',o.top],['objW',o.getScaledWidth()],['objH',o.getScaledHeight()],['angle',o.angle],['opacity',o.opacity*100]])$(id).value=Math.round(n);$('fillColor').value=colorValue(o.fill);$('strokeColor').value=colorValue(o.stroke);$('strokeWidth').value=o.strokeWidth||0;const isText=['textbox','i-text','text'].includes(o.type);$('textFields').hidden=!isText;$('textValue').parentElement.hidden=!isText;if(isText){if(document.activeElement!==$('textValue'))$('textValue').value=o.text;$('fontSize').value=o.fontSize;$('fontFamily').value=o.fontFamily;}$('imageTools').hidden=o.type!=='image';$('lockBtn').textContent=o.locked?'解锁':'锁定';$('roleSelect').value=o.role||'other';$('keepRatio').checked=o.keepRatio??o.type==='image';$('imageSlot').checked=!!o.imageSlot;window.ZTH_EFFECTS?.refresh();}
function hasLocked(o){return !!o&&(!!o.locked||!!o.getObjects?.().some(hasLocked));}
function canEdit(o=selected(),{silent=false}={}){if(editingBlocked()||!o)return false;if(hasLocked(o)){if(!silent)toast('请先解锁该元素');return false;}return true;}
function selectionBounds(){const o=selected();if(!o?.getBoundingRect)return null;o.setCoords();const b=o.getBoundingRect();return [b.left,b.top,b.width,b.height].every(Number.isFinite)&&b.width>0&&b.height>0?{left:b.left,top:b.top,width:b.width,height:b.height}:null;}
function getSelectionOverflow({margin=0}={}){
 const bounds=selectionBounds(),inset=Math.max(0,Number(margin)||0),edges=bounds?{left:Math.max(0,inset-bounds.left),top:Math.max(0,inset-bounds.top),right:Math.max(0,bounds.left+bounds.width-(width-inset)),bottom:Math.max(0,bounds.top+bounds.height-(height-inset))}:{left:0,top:0,right:0,bottom:0};
 return {overflow:Object.values(edges).some(value=>value>.01),bounds,edges,canFit:!!bounds&&canEdit(selected(),{silent:true})};
}
function fitSelectionToCanvas({margin=Math.min(width,height)*.05}={}){
 const o=selected();if(!canEdit(o))return false;const inset=Number(margin);if(!Number.isFinite(inset)||inset<0||inset*2>=Math.min(width,height))return false;
 let bounds=selectionBounds();if(!bounds)return false;
 const original={left:o.left,top:o.top,scaleX:o.scaleX,scaleY:o.scaleY},availableW=width-inset*2,availableH=height-inset*2;
 // Re-measure after each reduction: uniform strokes do not scale with the object.
 for(let attempt=0;attempt<16;attempt++){
  const ratio=Math.min(1,availableW/bounds.width,availableH/bounds.height);if(ratio>=1-1e-8)break;
  o.set({scaleX:o.scaleX*ratio,scaleY:o.scaleY*ratio});bounds=selectionBounds();if(!bounds)break;
 }
 if(!bounds||bounds.width>availableW+.01||bounds.height>availableH+.01){o.set(original);o.setCoords();canvas.requestRenderAll();toast('当前描边超出可用空间，请先减小描边或边距');return false;}
 const left=Math.max(inset,Math.min(bounds.left,width-inset-bounds.width)),top=Math.max(inset,Math.min(bounds.top,height-inset-bounds.height));
 o.set({left:o.left+left-bounds.left,top:o.top+top-bounds.top});o.setCoords();
 if(Object.entries(original).every(([key,value])=>Math.abs(o[key]-value)<1e-8))return false;
 canvas.requestRenderAll();changed('适配画布');return true;
}
function changeObject(fn,label='调整属性',options={}){let o=selected();if(!o)return toast('先选中一个元素');if(!canEdit(o))return;fn(o);o.setCoords();canvas.requestRenderAll();changed(label,options);}
for(const [id,key] of [['posX','left'],['posY','top'],['angle','angle'],['strokeWidth','strokeWidth']])$(id).onchange=()=>changeObject(o=>o.set(key,val(id)));
$('objW').onchange=()=>changeObject(o=>{o.scaleX=Math.max(1,val('objW'))/o.width;if($('keepRatio').checked)o.scaleY=o.scaleX;});$('objH').onchange=()=>changeObject(o=>{o.scaleY=Math.max(1,val('objH'))/o.height;if($('keepRatio').checked)o.scaleX=o.scaleY;});
$('opacity').onchange=()=>changeObject(o=>o.set('opacity',Math.max(0,Math.min(100,val('opacity')))/100));
let composingText=false;
const commitText=()=>{const o=selected();if(o)changeObject(target=>target.set('text',$('textValue').value),'编辑文字',{mergeKey:'text-'+objectKey(o)});};
$('textValue').addEventListener('blur',breakHistoryMerge);
$('textValue').oninput=e=>{if(!composingText&&!e.isComposing)commitText();};
$('textValue').onchange=()=>{if(!composingText)commitText();};
$('textValue').oncompositionstart=()=>{composingText=true;};
$('textValue').oncompositionend=()=>{composingText=false;commitText();};
for(const id of ['posX','posY','objW','objH','angle','opacity','strokeWidth','fontSize'])$(id).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();$(id).onchange?.();}});
for(const [id,key] of [['fillColor','fill'],['strokeColor','stroke'],['fontFamily','fontFamily']])$(id).onchange=()=>changeObject(o=>o.set(key,$(id).value));
$('fontSize').onchange=()=>changeObject(o=>o.set('fontSize',Math.min(500,Math.max(6,val('fontSize',36)))));
$('boldBtn').onclick=()=>changeObject(o=>o.set('fontWeight',o.fontWeight==='bold'?'normal':'bold'));$('italicBtn').onclick=()=>changeObject(o=>o.set('fontStyle',o.fontStyle==='italic'?'normal':'italic'));
document.querySelectorAll('[data-align]').forEach(b=>b.onclick=()=>changeObject(o=>o.set('textAlign',b.dataset.align)));
$('alignLeft').onclick=()=>changeObject(o=>o.set('left',width*.06));$('alignCenter').onclick=()=>changeObject(o=>o.set('left',(width-o.getScaledWidth())/2));$('alignMiddle').onclick=()=>changeObject(o=>o.set('top',(height-o.getScaledHeight())/2));
$('forwardBtn').onclick=()=>changeObject(o=>canvas.bringObjectForward(o),'上移一层');$('backwardBtn').onclick=()=>changeObject(o=>canvas.sendObjectBackwards(o),'下移一层');
function setLocked(o,value){if(value&&o.isEditing)o.exitEditing?.();o.locked=value;o.set({lockMovementX:value,lockMovementY:value,lockScalingX:value,lockScalingY:value,lockRotation:value,hasControls:!value});if(['textbox','text','i-text'].includes(o.type))o.set('editable',!value);}
function lock(o){if(editingBlocked())return;if(o.type==='activeselection'){const members=[...o.getObjects()],value=!members.every(i=>i.locked);canvas.discardActiveObject();members.forEach(i=>setLocked(i,value));}else setLocked(o,!o.locked);}
$('lockBtn').onclick=()=>{let o=selected();if(!o||editingBlocked())return;lock(o);canvas.requestRenderAll();changed('锁定 / 解锁');};
function remove(){if(editingBlocked())return;const os=canvas.getActiveObjects().filter(o=>!hasLocked(o));if(!os.length)return;canvas.discardActiveObject();canvas.remove(...os);canvas.requestRenderAll();changed('删除元素');}
async function duplicate(){
 const o=selected();if(!canEdit(o))return;const epoch=documentEpoch,generation=canvasGeneration,page=pageIndex,owner=workId,originals=canvas.getObjects().filter(item=>item===o||o.getObjects?.().includes(item));
 const cloned=await o.clone();if(epoch!==documentEpoch||generation!==canvasGeneration||page!==pageIndex||owner!==workId||editingBlocked()||originals.some(item=>!canvas.getObjects().includes(item))||!canEdit(o))return false;
 cloned.set({left:o.left+30,top:o.top+30});
 if(cloned.type==='activeselection'){cloned.canvas=canvas;cloned.forEachObject(i=>canvas.add(i));cloned.setCoords();canvas.setActiveObject(cloned);canvas.requestRenderAll();changed('复制元素');}
 else add(cloned,'复制元素');return true;
}
const historyClick=fn=>()=>fn().catch(error=>toast('操作未完成：'+error.message));
$('duplicateBtn').onclick=historyClick(duplicate);$('deleteBtn').onclick=remove;$('undoBtn').onclick=historyClick(undo);$('redoBtn').onclick=historyClick(redo);
function groupSelection(){
 if(editingBlocked())return;const selectedObjects=new Set(canvas.getActiveObjects()),all=canvas.getObjects(),os=all.filter(o=>selectedObjects.has(o));
 if(os.some(hasLocked))return toast('请先解锁选中的元素');if(os.length<2)return toast('Shift 选中两个或更多元素再组合');
 const position=Math.max(...os.map(o=>all.indexOf(o)))-os.length+1;canvas.discardActiveObject();canvas.remove(...os);const group=new F.Group(os,{name:'组合',role:'other'});canvas.insertAt(position,group);canvas.setActiveObject(group);canvas.requestRenderAll();changed('组合元素');
}
function ungroupSelection(){
 if(editingBlocked())return;const o=selected();if(hasLocked(o))return toast('请先解锁该元素');if(o?.type!=='group')return toast('先选中一个组合');
 const position=canvas.getObjects().indexOf(o),os=o.removeAll();canvas.discardActiveObject();canvas.remove(o);canvas.insertAt(position,...os);canvas.requestRenderAll();changed('拆分组合');
}
$('groupBtn').onclick=groupSelection;$('ungroupBtn').onclick=ungroupSelection;
function setBackground(color){if(editingBlocked())return false;canvas.backgroundColor=color;canvas.requestRenderAll();changed('修改背景');return true;}
$('bgColor').onchange=()=>setBackground($('bgColor').value);
$('gradientBtn').onclick=()=>{if(editingBlocked())return;canvas.backgroundColor=new F.Gradient({type:'linear',gradientUnits:'pixels',coords:{x1:0,y1:0,x2:width,y2:height},colorStops:[{offset:0,color:'#7750d8'},{offset:.55,color:'#cb5eae'},{offset:1,color:'#f7b078'}]});canvas.requestRenderAll();changed('修改渐变背景');};
function setLayerMultiSelect(enabled){layerMultiSelect=!!enabled;renderLayers();return layerMultiSelect;}
function getLayerMultiSelect(){return layerMultiSelect;}
function selectLayer(o){
 if(editingBlocked()||!canvas.getObjects().includes(o))return false;
 if(!layerMultiSelect)canvas.setActiveObject(o);
 else{
  const members=new Set(canvas.getActiveObjects());
  if(members.has(o))members.delete(o);else{if(hasLocked(o)){toast('请先解锁该元素');return false;}members.add(o);}
  // ActiveSelection stores children in its local plane. Deselecting first uses
  // Fabric's onDeselect/removeAll path to restore their world coordinates.
  canvas.discardActiveObject();
  const next=canvas.getObjects().filter(item=>members.has(item)&&!hasLocked(item));
  if(next.length===1)canvas.setActiveObject(next[0]);else if(next.length>1)canvas.setActiveObject(new F.ActiveSelection(next,{canvas}));
 }
 canvas.requestRenderAll();syncProps();renderLayers();return true;
}
function renderLayers(){let list=$('layers');list.replaceChildren();const objects=canvas.getObjects(),members=new Set(canvas.getActiveObjects());$('layerCount').textContent=objects.length;objects.slice().reverse().forEach(o=>{let row=document.createElement('div');row.className='layer'+(members.has(o)?' active':'');let name=document.createElement('button');name.className='layer-name';name.textContent=(o.type==='image'?'▧ ':o.type==='textbox'?'T ':'◇ ')+(o.name||o.text?.slice(0,18)||o.type);name.ariaPressed=String(members.has(o));name.title=layerMultiSelect?(members.has(o)?'已选中，点击取消选择':'点击加入多选'):'选择图层';name.onclick=()=>selectLayer(o);let lk=document.createElement('button');lk.textContent=o.locked?'🔒':'○';lk.title='锁定 / 解锁';lk.onclick=()=>{if(editingBlocked())return;lock(o);protectSelection();changed('锁定 / 解锁');};row.append(name,lk);list.append(row);});}
function protectSelection(){const active=selected();if(active?.type!=='activeselection')return;const members=active.getObjects(),editable=members.filter(o=>!hasLocked(o));if(editable.length===members.length)return;canvas.discardActiveObject();if(editable.length===1)canvas.setActiveObject(editable[0]);else if(editable.length>1)canvas.setActiveObject(new F.ActiveSelection(editable,{canvas}));canvas.requestRenderAll();}
canvas.on('selection:created',()=>{protectSelection();syncProps();renderLayers();});canvas.on('selection:updated',()=>{protectSelection();syncProps();renderLayers();});canvas.on('selection:cleared',syncProps);canvas.on('object:modified',()=>changed('移动 / 调整元素'));
canvas.on('text:changed',({target})=>{if(!target?.inCompositionMode)changed('编辑文字',{mergeKey:'text-'+objectKey(target)});});
canvas.on('text:editing:entered',({target})=>{breakHistoryMerge();target.hiddenTextarea?.addEventListener('compositionend',()=>{if(canvas.getObjects().includes(target))changed('编辑文字',{mergeKey:'text-'+objectKey(target)});});});
canvas.on('text:editing:exited',()=>{changed('编辑文字');breakHistoryMerge();});
canvas.on('object:moving',({target:o})=>{if(o.group)return;const snap=8/zoom;for(const x of [width*.06,(width-o.getScaledWidth())/2,width*.94-o.getScaledWidth()])if(Math.abs(o.left-x)<snap)o.left=x;for(const y of [height*.06,(height-o.getScaledHeight())/2,height*.94-o.getScaledHeight()])if(Math.abs(o.top-y)<snap)o.top=y;syncProps();});
$('zoomIn').onclick=()=>setZoom(zoom*1.2);$('zoomOut').onclick=()=>setZoom(zoom/1.2);$('fitBtn').onclick=fit;new ResizeObserver(()=>fit()).observe($('stage'));
async function dataURL(src){if(src.startsWith('data:'))return src;if(window.ZTH_BRAND?.isBrand(src))return ZTH_BRAND.get(src);let image=new Image();image.src=src;await image.decode();let c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return c.toDataURL('image/png');}
function readData(blob){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});}
async function sceneObject(d){let {kind,path,points,src,boxW,boxH,...p}=d;let o;if(kind==='group'){o=new F.Group(await Promise.all(d.children.map(sceneObject)),p);}else if(kind==='text')o=new F.Textbox(d.text,p);else if(kind==='path')o=new F.Path(path,p);else if(kind==='line')o=new F.Line(points,p);else if(kind==='image'){try{let imageData=await dataURL(src);if(d.colorKey&&!window.ZTH_BRAND?.isBrand(src)){let im=new Image();im.src=imageData;await im.decode();let el=document.createElement('canvas');el.width=im.width;el.height=im.height;let ctx=el.getContext('2d');ctx.drawImage(im,0,0);let pix=ctx.getImageData(0,0,im.width,im.height);let cut=ZTH_ALGORITHMS.removeColor(pix.data,im.width,im.height,0,0,30,false,8);ctx.putImageData(new ImageData(cut.data,im.width,im.height),0,0);imageData=el.toDataURL('image/png');}o=await F.FabricImage.fromURL(imageData);o.set({...p});const isLogo=window.ZTH_BRAND?.isBrand(src)||p.role==='logo';const scale=(isLogo?Math.min:Math.max)(boxW/o.width,boxH/o.height);if(!isLogo){const cw=boxW/scale,ch=boxH/scale;o.set({cropX:(o.width-cw)/2,cropY:(o.height-ch)/2,width:cw,height:ch});}o.set({scaleX:scale,scaleY:scale,name:p.name||'图片',role:p.role||(isLogo?'logo':'photo')});}catch(e){o=new F.Rect({...p,width:boxW,height:boxH,fill:'#e3e6d8',name:'照片占位',role:'photo'});}}else if(kind==='circle')o=new F.Circle(p);else o=new F.Rect(p);if(!o.name)o.name=kind==='text'?d.text.split('\n')[0].slice(0,16):'图形';if(!o.role)o.role=kind==='text'?(d.fontSize>=60?'title':'body'):'other';return o;}
async function renderScene(scene,target){target.clear();target.backgroundColor=scene.background;for(const d of scene.objects)target.add(await sceneObject(d));target.requestRenderAll();}
async function confirmSwitch(){
 if(window.ZTH_WORKS)return ZTH_WORKS.beforeSwitch();
 const prompt=$('replaceDialog');prompt.returnValue='cancel';
 return new Promise(resolve=>{prompt.addEventListener('close',()=>resolve(['save','discard'].includes(prompt.returnValue)),{once:true});prompt.showModal();});
}
async function applyTemplate(t,force=false){
 if(editingBlocked())return false;switching=true;notifyHistory();
 try{
  if(!force&&!await confirmSwitch())return false;
  cancelAutosave();const nextWorkId=crypto.randomUUID();let doc;
  if(t.document){doc=JSON.parse(JSON.stringify(t.document));doc.name=t.name+' · 副本';doc.workId=nextWorkId;}
  else{const scene=JSON.parse(JSON.stringify(t.build())),objects=await Promise.all(scene.objects.map(sceneObject));doc={format:'zthpmsj',schema:1,workId:nextWorkId,name:t.name+' · 副本',fonts:[],pages:[{width:scene.width,height:scene.height,canvas:{objects:objects.map(o=>o.toObject()),background:scene.background}}]};}
  await loadProject(doc,{label:'使用模板创建副本'});await window.ZTH_WORKS?.save();
  document.body.classList.remove('show-library');toast('已创建作品副本，原模板保持只读');return true;
 }finally{switching=false;notifyHistory();}
}
async function loadProject(doc,{label='打开作品'}={}){
 ZTH_ALGORITHMS.validateProject(doc);cancelAutosave();const epoch=++documentEpoch,nextDoc=JSON.parse(JSON.stringify(doc));
 return runCanvasOperation(async()=>{
  const nextPages=nextDoc.pages,nextIndex=Math.max(0,Math.min(Number(nextDoc.activePage)||0,nextPages.length-1));let nextFont;
  const previousFonts=window.ZTH_FONTS?ZTH_FONTS.collectUsed(pages):null;
  try{
   if(window.ZTH_FONTS)await ZTH_FONTS.loadEmbedded(nextDoc.fonts||[]);
   else if(nextDoc.fonts?.[0]?.src){nextFont=new FontFace('ZTH Sans','url('+nextDoc.fonts[0].src+')');await nextFont.load();}
   await hydrate(nextPages[nextIndex]);
  }catch(error){if(previousFonts)await ZTH_FONTS.loadEmbedded(previousFonts);throw error;}
  if(nextFont){document.fonts.add(nextFont);portableFont=nextDoc.fonts[0].src;}
  pages=nextPages;pageIndex=nextIndex;workId=nextDoc.workId||crypto.randomUUID();$('projectName').value=nextDoc.name||'未命名作品';
  await window.ZTH_WORKS?.activate(workId);resetHistory(label);renderPages();return true;
 },epoch);
}
async function newBlank(force=false){
 if((editingBlocked()&&!force)||busy)return false;const alreadySwitching=switching;switching=true;
 try{
  if(!force&&!await confirmSwitch())return false;
  await loadProject({format:'zthpmsj',schema:1,appVersion:'4.0.0',workId:crypto.randomUUID(),name:'未命名作品',fonts:[],activePage:0,pages:[{width:1080,height:1440,canvas:{objects:[],background:'#ffffff'}}]},{label:'新建空白作品'});
  await window.ZTH_WORKS?.save();document.body.classList.remove('show-library','show-properties');return true;
 }finally{switching=alreadySwitching;notifyHistory();}
}
$('newDraftBtn')?.addEventListener('click',()=>newBlank().catch(e=>toast('新建失败：'+e.message)));
async function thumbnail(t,img){if(t.thumb){img.src=t.thumb;return;}if(thumbs.has(t.id)){img.src=thumbs.get(t.id);return;}let s=t.build();let el=document.createElement('canvas');let c=new F.StaticCanvas(el,{width:180,height:Math.round(180*s.height/s.width),enableRetinaScaling:false});c.setZoom(180/s.width);await renderScene(s,c);let url=c.toDataURL({format:'png'});thumbs.set(t.id,url);img.src=url;c.dispose();}
const titles={templates:'从一个好设计开始',text:'让文字更有力量',elements:'小元素，大灵感',brand:'你的品牌，随时在场',uploads:'把素材放进设计',smart:'排版交给灵感助手'};
function button(txt,fn,cls=''){let b=document.createElement('button');b.textContent=txt;b.className=cls;b.onclick=fn;return b;}
function note(txt){let p=document.createElement('p');p.className='library-note';p.textContent=txt;return p;}
function openTab(tab){activeTab=tab;$('panelTitle').textContent=titles[tab];document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const body=$('libraryBody');body.replaceChildren();
if(tab==='templates'){if(window.ZTH_TEMPLATE?.renderLibrary){ZTH_TEMPLATE.renderLibrary(body);return;}let input=document.createElement('input');input.className='search';input.placeholder='搜索招新、活动、讲座…';input.value=query;input.oninput=()=>{query=input.value;renderCards();};body.append(input);let acts=document.createElement('div');acts.className='template-actions';acts.append(button('保存当前为模板',()=>window.ZTH_TEMPLATE.openSave()),button('导出当前模板',()=>window.ZTH_TEMPLATE.openSave()));body.append(acts);let chips=document.createElement('div');chips.className='chips';['全部','招新','活动','讲座','展览','内容','品牌','我的模板'].forEach(c=>chips.append(button(c,()=>{category=c;openTab('templates');},'chip'+(category===c?' active':''))));body.append(chips);let grid=document.createElement('div');grid.className='template-grid';body.append(grid);function renderCards(){grid.replaceChildren();[...ZTH_TEMPLATES,...(window.ZTH_TEMPLATE?.list()||[])].filter(t=>(category==='全部'||t.category===category)&&(!query||(t.name+t.category).includes(query))).forEach(t=>{let b=button('',()=>applyTemplate(t),'template-card'),img=document.createElement('img'),name=document.createElement('b'),meta=document.createElement('small');img.alt=t.name;name.textContent=t.name;const dims=t.document?t.document.pages[0]:t.build();meta.textContent=dims.width+' × '+dims.height+' · 原件只读';b.append(img,name,meta);grid.append(b);thumbnail(t,img);});}renderCards();body.append(note('模板原件只读，点击创建可编辑副本。示例日期仅为演示，请填写实际信息。'));}
if(tab==='text'){body.append(button('添加大标题',()=>text('你的大标题',100),'text-option'),button('添加小标题',()=>text('让每一个想法，都有被看见的机会',45),'text-option'),button('添加正文',()=>text('在这里写下活动内容、时间地点与参与方式。',28),'text-option'));body.append(note('双击文字直接编辑。选中后在右侧设置字体、颜色、字号和对齐方式。字号会随画布缩放显示。'));}
if(tab==='elements'){if(window.ZTH_ELEMENTS)ZTH_ELEMENTS.render(body);else{let grid=document.createElement('div');grid.className='element-grid';[['▭','rect'],['●','circle'],['△','triangle'],['─','line'],['★','star'],['↗','arrow'],['⬡','hexagon'],['▱','parallelogram']].forEach(([label,kind])=>grid.append(button(label,()=>{const p={left:width*.3,top:height*.35,fill:'#9475db',name:'形状',role:'other'};if(kind==='rect')add(new F.Rect({...p,width:320,height:180,rx:12,ry:12}));if(kind==='circle')add(new F.Circle({...p,radius:110}));if(kind==='triangle')add(new F.Triangle({...p,width:260,height:220}));if(kind==='line')add(new F.Line([100,100,500,100],{stroke:'#9475db',strokeWidth:6,name:'线条'}));if(kind==='star')add(new F.Polygon(Array.from({length:10},(_,i)=>{let a=i*Math.PI/5-Math.PI/2,r=i%2?50:115;return {x:Math.cos(a)*r,y:Math.sin(a)*r};}),p));if(kind==='hexagon')add(new F.Polygon(Array.from({length:6},(_,i)=>({x:130+130*Math.cos(i*Math.PI/3),y:115+115*Math.sin(i*Math.PI/3)})),{...p,name:'六边形'}));if(kind==='parallelogram')add(new F.Polygon([{x:60,y:0},{x:320,y:0},{x:260,y:160},{x:0,y:160}],{...p,name:'平行四边形'}));if(kind==='arrow')add(new F.Path('M 0 40 L 200 40 L 200 0 L 280 80 L 200 160 L 200 120 L 0 120 Z',p));})));body.append(grid);}body.append(button('＋ 自定义多边形',startPolygon,'wide'),button('完成多边形',finishPolygon,'wide'),button('＋ 二维码占位框',addQRPlaceholder,'wide'),button('＋ 内容卡片',addContentCard,'wide'));let sw=document.createElement('div');sw.className='swatches';['#7352dc','#f26536','#e7fb85','#1763cc','#78a92c','#172d54','#f7f3eb','#ffffff','#222222'].forEach(c=>{let b=button('',()=>{if(selected())changeObject(o=>window.ZTH_EFFECTS?ZTH_EFFECTS.paint(o,'ink',c):o.set('fill',c));else setBackground(c);});b.style.background=c;b.title=c;sw.append(b);});body.append(sw,note('支持原生矢量形状、描边和透明度。二维码占位可直接替换成真实二维码；也可在灵感面板输入网址生成。'));}
if(tab==='brand'){[['赋形造物 · 深色横版','02-81900.png'],['赋形造物 · 浅色横版','01-81899.png'],['赋形造物 · 竖版','03-81893.png'],['赋形造物 · 深色竖版','04-81895.png'],['赋形造物 · 独立标识','05-81892.png'],['向阳 / 图学 / 模型 · 组合','06-81867.png'],['三社团联名 · 横版','07-81868.png']].forEach(([name,file])=>{let b=button('',()=>insertImage('assets/'+file,name,'logo'),'brand-card'+(file.startsWith('01')||file.startsWith('04')||file.startsWith('05')?' dark':'')),img=document.createElement('img'),span=document.createElement('span');if(window.ZTH_BRAND)ZTH_BRAND.get('assets/'+file).then(src=>img.src=src).catch(()=>img.src='assets/'+file);else img.src='assets/'+file;img.alt=name;span.textContent=name;b.append(img,span);body.append(b);});body.append(note('默认标志已去除纯色背景；棋盘格用于预览透明区域。请根据画布底色选择深色或浅色标志。'));}
if(tab==='uploads'){body.append(button('↑ 点击上传 / 拖入图片\nPNG · JPG · WebP · SVG','upload'==='x'?null:()=>$('uploadInput').click(),'upload-zone'));body.append(button('导入工程 / PDF / PPTX / SVG',()=>$('projectInput').click(),'wide'));let grid=document.createElement('div');grid.className='upload-grid';uploads.forEach((u,i)=>{let b=button('',()=>insertImage(u.src,u.name)),img=document.createElement('img');img.src=u.src;img.alt=u.name;b.append(img);grid.append(b);});body.append(grid,note('PDF 按页作为图片导入；PPTX 导入基础文字、矩形与照片；复杂效果可能需要调整。可画请先导出以上格式。所有图片都会嵌入 .zthpmsj。'));}
if(tab==='smart')renderSmart(body);
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openTab(b.dataset.tab));
async function insertImage(src,name='图片',role='photo',properties={}){
 if(editingBlocked())return null;const epoch=documentEpoch,generation=canvasGeneration,page=pageIndex,owner=workId,existing=selected();
 const img=await F.FabricImage.fromURL(await dataURL(src));if(epoch!==documentEpoch||generation!==canvasGeneration||page!==pageIndex||owner!==workId||editingBlocked())return null;
 const scale=Math.min(width*.65/img.width,height*.55/img.height,1);img.set({left:width*.15,top:height*.25,scaleX:scale,scaleY:scale,name,role,...properties});
 if(existing?.role==='qr'){
  if(selected()!==existing||!canvas.getObjects().includes(existing)||!canEdit(existing))return null;
  const index=canvas.getObjects().indexOf(existing),size=Math.min(existing.getScaledWidth(),existing.getScaledHeight());img.scaleToWidth(size);img.set({left:existing.left,top:existing.top,angle:existing.angle,originX:existing.originX,originY:existing.originY,role:'qr'});
  canvas.discardActiveObject();canvas.remove(existing);canvas.insertAt(index,img);canvas.setActiveObject(img);canvas.requestRenderAll();changed('替换二维码');return img;
 }
 return add(img,role==='qr'?'生成二维码':'添加图片');
}
async function uploadFiles(files){if(editingBlocked())return;const epoch=documentEpoch,generation=canvasGeneration,page=pageIndex;for(const file of files){try{if(file.size>25*1024*1024)throw Error('单张图片请小于 25 MB');if(!/^image\/(png|jpeg|webp)$/.test(file.type)){if(file.name.toLowerCase().endsWith('.svg')){await importSVG(await file.text());continue;}throw Error('支持 PNG / JPG / WebP / SVG');}let raw=await readData(file),image=new Image();image.src=raw;await image.decode();if(image.width*image.height>24000000)throw Error('单张图片请小于 2400 万像素');uploads.push({name:file.name,src:raw});if(epoch!==documentEpoch||generation!==canvasGeneration||page!==pageIndex)continue;if(selected()?.imageSlot)await window.ZTH_TEMPLATE.replaceWithFile(file,selected());else await insertImage(raw,file.name,/logo|标志|校徽|标识/i.test(file.name)?'logo':'photo');}catch(e){toast(e.message);}}dbPut('uploads',uploads.slice(-25)).catch(()=>{});if(activeTab==='uploads')openTab('uploads');}
$('uploadInput').onchange=e=>{uploadFiles(e.target.files);e.target.value='';};$('stage').ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';};$('stage').ondrop=e=>{e.preventDefault();const fs=[...e.dataTransfer.files];if(fs.length===1&&/\.(zthpmsj|zth|json|pdf|pptx)$/i.test(fs[0].name))importFile(fs[0]);else uploadFiles(fs);};
function cancelPolygon(){drawingPolygon=false;polygonPoints=[];if(polygonPreview)canvas.remove(polygonPreview);polygonPreview=null;}
function startPolygon(){if(editingBlocked())return;polygonPoints=[];drawingPolygon=true;canvas.discardActiveObject();canvas.selection=false;canvas.skipTargetFind=true;toast('在画布上点出顶点，完成后点“完成多边形”；Esc 取消');}
function finishPolygon(){if(editingBlocked()||!drawingPolygon)return;drawingPolygon=false;canvas.selection=true;canvas.skipTargetFind=false;if(polygonPreview){canvas.remove(polygonPreview);polygonPreview=null;}const pts=polygonPoints.filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>1);if(pts.length<3)return toast('至少需要三个顶点');const minX=Math.min(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y));add(new F.Polygon(pts.map(p=>({x:p.x-minX,y:p.y-minY})),{left:minX,top:minY,fill:'#f26536',name:'自定义多边形',role:'other'}));}
canvas.on('mouse:down',e=>{if(!drawingPolygon)return;const p=canvas.getScenePoint(e.e);polygonPoints.push({x:p.x,y:p.y});if(polygonPreview)canvas.remove(polygonPreview);polygonPreview=new F.Polyline(polygonPoints,{fill:'rgba(115,82,220,.2)',stroke:'#7352dc',strokeWidth:3,selectable:false,evented:false,excludeFromExport:true});canvas.add(polygonPreview);canvas.requestRenderAll();});
canvas.on('mouse:dblclick',()=>{if(drawingPolygon)finishPolygon();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawingPolygon){drawingPolygon=false;canvas.selection=true;canvas.skipTargetFind=false;if(polygonPreview)canvas.remove(polygonPreview);polygonPreview=null;canvas.requestRenderAll();}});
function addQRPlaceholder(){let size=width*.18;let r=new F.Rect({width:size,height:size,fill:'#ffffff',stroke:'#77a72a',strokeWidth:3,rx:4,ry:4});let t=new F.Textbox('二维码占位\n选中后上传替换',{left:15,top:size*.32,width:size-30,fontSize:size*.1,fill:'#64744d',textAlign:'center',fontFamily:'ZTH Sans'});add(new F.Group([r,t],{left:width*.7,top:height*.78,name:'二维码占位',role:'qr'}));}
function addContentCard(){let w=width*.4,h=height*.14;add(new F.Group([new F.Rect({width:w,height:h,fill:'#ffffff',rx:12,ry:12,stroke:'#dddddd',strokeWidth:1}),new F.Textbox('内容标题',{left:25,top:22,width:w-50,fontSize:width*.032,fontFamily:'ZTH Sans',fill:'#172d54',fontWeight:'bold'}),new F.Textbox('双击组合内文字可先拆分，\n填写项目介绍和参与信息。',{left:25,top:h*.43,width:w-50,fontSize:width*.021,fontFamily:'ZTH Sans',fill:'#6b7483',lineHeight:1.4})],{left:width*.15,top:height*.45,name:'内容卡片',role:'body'}));}
function renderSmart(body){let card=document.createElement('div');card.className='smart-card';card.innerHTML='<h3>✧ 规则排版助手</h3><p>设定素材角色，自动生成三种构图。文字会适应空间；所有元素仍可继续编辑。无需模型，离线运行。</p><label>活动标题<input id="smartTitle" value="把想法，做成真的。"></label><label>副标题<input id="smartSubtitle" value="造物开放日 · 设计 / 制造 / 分享"></label><label>时间地点<input id="smartDetails" value="12月6日 14:00–17:00 · 赋形造物工作室"></label>';
card.append(button('用文案生成设计',async()=>{if(!await applyTemplate(ZTH_TEMPLATES[0]))return;let title=canvas.getObjects().find(o=>o.role==='title');if(title)title.set('text',$('smartTitle').value);let os=canvas.getObjects().filter(o=>o.type==='textbox');os.find(o=>o.text==='造物开放日')?.set('text',$('smartSubtitle').value);os.find(o=>o.text.startsWith('2026.12.06'))?.set('text',$('smartDetails').value);canvas.requestRenderAll();changed();},'primary wide'));body.append(card,button('整理当前素材 · 换一种布局',smartArrange,'wide'),note('选中元素，在属性栏设置“排版角色”：标题、正文、照片、LOGO、二维码。拖入素材后点自动排版。排版会移动、缩放现有元素，可撤销。'));
let label=document.createElement('label');label.textContent='输入网址，生成真实二维码';let input=document.createElement('input');input.id='qrURL';input.value=selected()?.qrText||'';input.placeholder='https://…';label.append(input);let qrOptions=document.createElement('div');qrOptions.innerHTML='<div class="pair"><label>码色<input id="qrDark" type="color" value="#142c4a"></label><label>背景<input id="qrLight" type="color" value="#ffffff"></label></div>';body.append(label,qrOptions,button('生成二维码',async()=>{if(!input.value.trim())return toast('请先输入网址或文字');if(input.value.length>1500)return toast('二维码内容请控制在 1500 字符内');try{const epoch=documentEpoch,generation=canvasGeneration,page=pageIndex,qrText=input.value,qrDark=$('qrDark').value,qrLight=$('qrLight').value;let url=await window.makeQR(qrText,{dark:qrDark,light:qrLight});if(epoch!==documentEpoch||generation!==canvasGeneration||page!==pageIndex)return;await insertImage(url,'二维码','qr',{qrText,qrDark,qrLight});}catch(e){toast('二维码生成失败：'+e.message);}},'wide'));
}
function smartArrange(){if(editingBlocked())return;const os=canvas.getObjects();if(!os.length)return toast('先拖入图片或添加文字，再设置排版角色');let placements=ZTH_ALGORITHMS.autoLayout(os.map((o,i)=>({id:i,role:o.role||'other'})),width,height,layoutVariant++);for(const p of placements){let o=os[p.id];if(hasLocked(o))continue;if(o.type==='textbox'){o.set({left:p.x,top:p.y,width:p.width,scaleX:1,scaleY:1,fontSize:Math.min(o.role==='title'?width*.1:width*.035,p.height*.65)});while(o.height>p.height&&o.fontSize>12)o.set('fontSize',o.fontSize-1);}else{const scale=Math.min(p.width/o.width,p.height/o.height);o.set({left:p.x,top:p.y,scaleX:scale,scaleY:scale});}o.setCoords();}canvas.discardActiveObject();canvas.requestRenderAll();changed('自动排版');toast('已生成布局 '+((layoutVariant-1)%3+1)+' / 3 · 可撤销或再次换版');}
async function download(blob,name){if(window.ZTHiOS){const data=await readData(blob);window.ZTHiOS.save(name,data.split(',')[1]);return;}if(window.ZTHAndroid){const data=await readData(blob);window.ZTHAndroid.save(name,data.split(',')[1]);return;}if(window.zthDesktop){const bytes=new Uint8Array(await blob.arrayBuffer());const result=await window.zthDesktop.save({name,bytes});toast(result?'已保存：'+name:'已取消保存');return;}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),20000);toast('已导出：'+name);}
function safeName(){return ($('projectName').value||'ZTH-design').replace(/[\\/:*?"<>|]/g,'-').slice(0,90);}
$('saveBtn').onclick=async()=>{try{await operationTail;const doc=project();await download(new Blob([JSON.stringify(doc)],{type:'application/json'}),safeName()+'.zthpmsj');}catch(e){toast('备份失败：'+e.message);}};
$('openBtn').onclick=()=>$('projectInput').click();$('projectInput').onchange=async e=>{if(e.target.files[0])await importFile(e.target.files[0]);e.target.value='';};
async function importFile(file){if(editingBlocked())return;try{if(file.size>60*1024*1024)throw Error('文件超过 60 MB，请分成较小的工程');let ext=file.name.split('.').pop().toLowerCase();if(['zthpmsj','zth','json'].includes(ext)){let doc=JSON.parse(await file.text());ZTH_ALGORITHMS.validateProject(doc);switching=true;notifyHistory();try{if(!await confirmSwitch())return;await loadProject(doc);await window.ZTH_WORKS?.save();toast('工程已打开 · 图片已内嵌');}finally{switching=false;notifyHistory();}}else if(ext==='svg')await importSVG(await file.text());else if(ext==='pdf')await ZTH_IMPORT.pdf(file);else if(ext==='pptx')await ZTH_IMPORT.pptx(file);else if(['png','jpg','jpeg','webp'].includes(ext))await uploadFiles([file]);else throw Error('不支持该文件，请先从可画导出 PNG / JPG / PDF / SVG / PPTX。');}catch(e){toast('导入失败：'+e.message);}}
async function importSVG(source){if(editingBlocked())return;const epoch=documentEpoch,generation=canvasGeneration,page=pageIndex;if(source.length>5e6)throw Error('SVG 文件过大');const doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('SVG 语法无效');doc.querySelectorAll('script,foreignObject,iframe,style,animate,animateTransform,set').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes]){if(/^on/i.test(a.name)||(/href$/i.test(a.name)&&!a.value.startsWith('#')&&!/^data:image\/(png|jpeg|webp);base64,/.test(a.value))||(/url\(/i.test(a.value)&&!/url\(\s*#/.test(a.value)))n.removeAttribute(a.name);}});let {objects,options}=await F.loadSVGFromString(new XMLSerializer().serializeToString(doc));if(epoch!==documentEpoch||generation!==canvasGeneration||page!==pageIndex||editingBlocked())return;objects=objects.filter(Boolean);if(objects.length>1200)throw Error('SVG 元素过多');let g=F.util.groupSVGElements(objects,options);g.set({left:width*.1,top:height*.15,name:'导入 SVG',role:'other'});g.scaleToWidth(width*.8);add(g,'导入 SVG');toast('SVG 已作为可拆分矢量组合导入');}
$('resizeBtn').onclick=()=>{$('canvasW').value=width;$('canvasH').value=height;$('resizeDialog').showModal();};$('sizePreset').onchange=()=>{let [w,h]=$('sizePreset').value.split(',');$('canvasW').value=w;$('canvasH').value=h;};
function resizeCanvas(w,h,{scaleContent=false}={}){
 if(editingBlocked())return false;w=Math.round(Number(w));h=Math.round(Number(h));
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<100||h<100||w>8000||h>8000||w*h>24000000){toast('尺寸需为 100–8000 px，单页不超过 2400 万像素');return false;}
 if(scaleContent){const sx=w/width,sy=h/height;canvas.discardActiveObject();canvas.getObjects().forEach(o=>{if(hasLocked(o))return;o.set({left:o.left*sx,top:o.top*sy,scaleX:o.scaleX*Math.min(sx,sy),scaleY:o.scaleY*Math.min(sx,sy)});o.setCoords();});}
 width=w;height=h;fit();changed('调整画布尺寸');return true;
}
$('applySize').onclick=()=>{if(resizeCanvas(val('canvasW'),val('canvasH'),{scaleContent:$('scaleContent').checked}))$('resizeDialog').close();};
$('exportBtn').onclick=()=>{if(editingBlocked())return;$('exportInfo').textContent=width+' × '+height+' px · 当前页面';$('exportDialog').showModal();};
$('downloadBtn').onclick=async()=>{if(editingBlocked())return;let old=canvas.backgroundColor;try{let format=$('exportFormat').value,scale=val('exportScale',1);if(width*height*scale*scale>48000000)throw Error('导出超过 4800 万像素，请降低倍率');canvas.discardActiveObject();if($('transparent').checked&&format!=='jpeg')canvas.backgroundColor='';else if(format==='jpeg'&&!canvas.backgroundColor)canvas.backgroundColor='#ffffff';let blob;if(format==='svg'){let svg=canvas.toSVG({width,height,viewBox:{x:0,y:0,width,height}});if(window.ZTH_FONTS)svg=svg.replace('<defs>','<defs><style>'+ZTH_FONTS.svgCSS([snapshot()])+'</style>');else if(portableFont)svg=svg.replace('<defs>','<defs><style>@font-face{font-family:ZTH Sans;src:url('+portableFont+')}</style>');blob=new Blob([svg],{type:'image/svg+xml'});}else{let oldTransform=canvas.viewportTransform;canvas.setViewportTransform([1,0,0,1,0,0]);const el=canvas.toCanvasElement(scale,{width,height,left:0,top:0,enableRetinaScaling:false});canvas.setViewportTransform(oldTransform);if(format==='pdf'){let doc=new jspdf.jsPDF({orientation:width>height?'landscape':'portrait',unit:'px',format:[width,height],hotfixes:['px_scaling']});doc.addImage(el.toDataURL('image/jpeg',.96),'JPEG',0,0,width,height);blob=doc.output('blob');}else blob=await new Promise(r=>el.toBlob(r,'image/'+format,.95));if(!blob)throw Error('图像导出失败');}await download(blob,safeName()+'.'+(format==='jpeg'?'jpg':format));$('exportDialog').close();}catch(e){toast(e.message);}finally{canvas.backgroundColor=old;canvas.requestRenderAll();}};
$('helpBtn').onclick=async()=>{$('environment').textContent=window.zthDesktop?await window.zthDesktop.environment():'网页模式 · 本地保存可用 · 浏览器文件导出 · 无需云服务器';$('helpDialog').showModal();};
$('projectName').onchange=changed;
let pendingKeyboardSave=null;
function saveFromKeyboard(backup,isComposing=false){
 const focused=document.activeElement;
 if((isComposing||composingText||selected()?.inCompositionMode)&&focused?.addEventListener){
  if(pendingKeyboardSave?.element===focused){pendingKeyboardSave.backup=backup;return;}
  const intent={element:focused,backup};pendingKeyboardSave=intent;
  focused.addEventListener('compositionend',()=>{if(pendingKeyboardSave!==intent)return;pendingKeyboardSave=null;Promise.resolve().then(()=>saveFromKeyboard(intent.backup));},{once:true});return;
 }
 pendingKeyboardSave=null;
 if(!editingBlocked()){
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(focused?.tagName||''))focused.onchange?.call(focused,{type:'change',target:focused,currentTarget:focused});
  const active=selected();if(active?.isEditing)active.exitEditing();
 }
 (backup?$('saveBtn'):($('quickSaveBtn')||$('saveBtn'))).click();
}
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented)return;const ctrl=e.ctrlKey||e.metaKey;
 // Save belongs to the document even while a property field is focused. Text
 // undo/redo stays native, and an active IME candidate is saved only after commit.
 if(ctrl&&e.key.toLowerCase()==='s'){e.preventDefault();saveFromKeyboard(!!e.shiftKey,e.isComposing);return;}
 if(busy||e.isComposing||document.querySelector('dialog[open]')||e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||selected()?.isEditing)return;
 if(ctrl&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?redo():undo()).catch(error=>toast('撤销未完成：'+error.message));}
 else if(ctrl&&e.key.toLowerCase()==='y'){e.preventDefault();redo().catch(error=>toast('重做未完成：'+error.message));}
 else if(ctrl&&e.key.toLowerCase()==='d'){e.preventDefault();duplicate().catch(error=>toast('复制失败：'+error.message));}
 else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove();}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selected()){e.preventDefault();changeObject(o=>{let d=e.shiftKey?10:1;o.set({left:o.left+(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0),top:o.top+(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0)});});}
});

function getPages(){currentIntoPages();return pages.map((page,index)=>({index,name:page.name||'页面 '+(index+1),width:page.width,height:page.height,active:index===pageIndex}));}
function switchPage(index){
 if(switching)return Promise.resolve(false);return runCanvasOperation(async()=>{
  if(!Number.isInteger(index)||index<0||index>=pages.length||index===pageIndex)return false;
  currentIntoPages();await hydrate(pages[index]);pageIndex=index;updateHistory();renderPages();return true;
 });
}
async function appendPage(page,label='添加页面'){
 if(pages.length>=30)throw Error('单个工程最多 30 页');currentIntoPages();
 const next=JSON.parse(JSON.stringify(page||{width,height,canvas:{objects:[],background:'#ffffff'},name:'新页面'}));
 ZTH_ALGORITHMS.validateProject({format:'zthpmsj',schema:1,pages:[next]});await hydrate(next);pages.push(next);pageIndex=pages.length-1;changed(label);renderPages();return true;
}
function addPage(page){if(switching)return Promise.resolve(false);return runCanvasOperation(()=>appendPage(page));}
function deletePage(index=pageIndex){
 if(switching)return Promise.resolve(false);return runCanvasOperation(async()=>{
  if(pages.length<=1){toast('作品至少保留一页');return false;}if(!Number.isInteger(index)||index<0||index>=pages.length)return false;
  currentIntoPages();const nextPages=pages.filter((_page,i)=>i!==index),nextIndex=Math.max(0,Math.min(pageIndex-(index<pageIndex?1:0),nextPages.length-1));
  await hydrate(nextPages[nextIndex]);pages=nextPages;pageIndex=nextIndex;changed('删除页面');renderPages();return true;
 });
}
function duplicatePage(index){
 if(switching)return Promise.resolve(false);return runCanvasOperation(()=>{
  currentIntoPages();const page=pages[index??pageIndex];if(!page)return false;
  const copied=JSON.parse(JSON.stringify(page));copied.name=(page.name||'页面 '+((index??pageIndex)+1))+' · 副本';return appendPage(copied,'复制页面');
 });
}
function renamePage(index,name){if(editingBlocked()||!pages[index])return false;pages[index].name=String(name).trim().slice(0,80)||'页面 '+(index+1);changed('重命名页面');renderPages();return true;}
function renderPages(){let el=$('pages');el.replaceChildren();pages.forEach((p,i)=>el.append(button('第 '+(i+1)+' 页',historyClick(()=>switchPage(i)),i===pageIndex?'page active':'page')));el.append(button('＋',historyClick(()=>addPage())));}
window.ZTH_EDITOR={loadProject,applyTemplate,newBlank,canEdit,add,changeObject,syncProps,cancelAutosave,canvas,sceneObject,insertImage,download,toast,dbGet,dbPut,dbAtomic,openTab,getProject:project,getSize:()=>({width,height}),addImportedPage:addPage,changed,importFile,
 undo,redo,goToHistory,getHistory,subscribeHistory,whenIdle:()=>operationTail,hasPendingOperations:()=>operationCount>0,isBusy:editingBlocked,breakHistoryMerge,getPages,switchPage,addPage,deletePage,duplicatePage,renamePage,resizeCanvas,setBackground,getSelectionOverflow,fitSelectionToCanvas,setLayerMultiSelect,getLayerMultiSelect,remove,duplicate,groupSelection,ungroupSelection};
window.ZTHAndroidSaved=ok=>toast(ok?'文件已保存到所选位置':'保存已取消或失败');
async function init(){
 if(window.ZTH_FONTS){await ZTH_FONTS.ready;const options=$('fontFamily');for(const entry of ZTH_FONTS.list()){let option=Array.from(options.options).find(item=>item.value===entry.family);if(!option){option=document.createElement('option');option.value=entry.family;options.append(option);}option.textContent=entry.label;}}
 else try{portableFont=window.zthDesktop?await window.zthDesktop.font():await readData(await(await fetch('assets/fonts/ZTHSans.woff2')).blob());portableFont=portableFont.replace(/^data:[^;]+;/,'data:font/woff2;');const font=new FontFace('ZTH Sans','url('+portableFont+')');await font.load();document.fonts.add(font);}catch(e){toast('内置字体加载失败，将使用系统字体');}
 await document.fonts.ready;await window.ZTH_TEMPLATE?.ready;await window.ZTH_WORKS?.ready;openTab('templates');
 try{uploads=await dbGet('uploads')||[];const saved=window.ZTH_WORKS?await ZTH_WORKS.loadAutosave():await dbGet('autosave');if(saved){await loadProject(saved);toast('已恢复上次自动保存的作品');}else await newBlank(true);}
 catch(e){await newBlank(true);toast('已打开空白草稿，可从我的作品恢复历史设计');}
 renderPages();if(!window.ZTHAndroid&&!window.ZTHiOS&&'serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
if(window.zthDesktop)window.zthDesktop.onProject(text=>importFile(new File([text],'打开的作品.zthpmsj',{type:'application/json'})));
init().then(()=>{document.querySelectorAll('[data-boot-inert]').forEach(el=>{el.inert=false;el.removeAttribute('data-boot-inert');});$('bootScreen')?.remove();window.ZTH_READY=true;window.zthDesktop?.ready();}).catch(e=>{const status=$('bootMessage');if(status)status.textContent='工作台载入失败，请重新打开应用。'+e.message;});
