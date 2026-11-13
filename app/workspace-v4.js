(function(){
'use strict';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
const icon=(name,size)=>window.ZTH_ICONS.make(name,size),button=(label,name,fn)=>{const b=el('button','v4-button');b.type='button';b.title=label;b.setAttribute('aria-label',label);if(name)b.append(icon(name));b.append(el('span','',label));if(fn)b.onclick=fn;return b;};
function start(){
 if(!window.ZTH_READY){if($('bootMessage')?.textContent.includes('失败'))return;requestAnimationFrame(start);return;}
 const E=ZTH_EDITOR,C=E.canvas;
 document.body.classList.add('studio-v4');
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 let motion;try{motion=localStorage.getItem('zth-motion')||'system';}catch{motion='system';}
 function updateMotion(){document.documentElement.dataset.motion=motion==='off'||motion==='system'&&mq.matches?'off':'on';}
 updateMotion();mq.addEventListener('change',updateMotion);
 const motionSetting=el('select');motionSetting.id='motionSetting';for(const [value,label]of [['system','跟随系统'],['on','轻柔动效'],['off','减少动态效果']]){const o=el('option','',label);o.value=value;motionSetting.append(o);}motionSetting.value=motion;
 const motionLabel=el('label','','界面动效');motionLabel.append(motionSetting);document.querySelector('[data-settings-panel="general"]')?.append(motionLabel);
 motionSetting.onchange=()=>{motion=motionSetting.value;try{localStorage.setItem('zth-motion',motion);}catch{}updateMotion();};
 const replaceButton=(id,name,label)=>{const b=$(id);if(!b)return;b.replaceChildren(icon(name),el('span','',label));b.classList.add('v4-button');b.setAttribute('aria-label',label);};
 const navIcons={templates:'LayoutTemplate',text:'Type',elements:'Shapes',brand:'Hexagon',uploads:'Upload',smart:'Sparkles'};
 document.querySelectorAll('nav [data-tab]').forEach(b=>{b.querySelector('span')?.replaceChildren(icon(navIcons[b.dataset.tab],21));});
 $('settingsBtn').querySelector('span').replaceChildren(icon('Settings2',21));
 document.querySelector('.wordmark small').textContent='本地创作工作台 · 4.0';
 replaceButton('newDraftBtn','Plus','新建');replaceButton('worksBtn','FolderOpen','作品');replaceButton('exportBtn','Download','导出');
 replaceButton('undoBtn','Undo2','撤销');replaceButton('redoBtn','Redo2','重做');replaceButton('duplicateBtn','Copy','复制');replaceButton('deleteBtn','Trash2','删除');replaceButton('groupBtn','Group','组合');replaceButton('ungroupBtn','Ungroup','拆分');
 replaceButton('propertiesBtn','SlidersHorizontal','属性');replaceButton('selectionMore','SlidersHorizontal','更多');
 $('undoBtn').title='撤销 · Ctrl+Z';$('redoBtn').title='重做 · Ctrl+Shift+Z / Ctrl+Y';
 const header=document.querySelector('.header-actions');
 const files=el('details','v4-file-menu');files.id='fileMenu';const fileSummary=el('summary');fileSummary.append(el('span','','文件'),icon('ChevronDown',14));files.append(fileSummary);
 const fileItems=el('div','v4-menu');files.append(fileItems);header.prepend(files);
 replaceButton('openBtn','FolderOpen','打开工程 / 导入');replaceButton('saveBtn','Save','备份工程 .zthpmsj');replaceButton('helpBtn','BookOpen','帮助与快捷键');
 fileItems.append($('openBtn'),$('saveBtn'),$('helpBtn'));fileItems.addEventListener('click',e=>{if(e.target.closest('button'))files.open=false;});
 const quickSave=button('保存','Save',async()=>{quickSave.disabled=true;try{const result=await window.ZTH_WORKS.save(true);if(result?.skipped)throw Error('作品已在其他窗口变更，请先备份工程或重新打开作品');E.toast('已保存到我的作品 · 可在历史版本中恢复');}catch(e){E.toast('保存失败：'+e.message);}finally{quickSave.disabled=false;}});quickSave.id='quickSaveBtn';quickSave.title='保存到此设备 · Ctrl+S';header.insertBefore(quickSave,$('exportBtn'));
 const commandBtn=button('查找操作','Search',()=>openCommands());commandBtn.id='commandBtn';commandBtn.title='查找操作 · Ctrl+K';header.insertBefore(commandBtn,$('worksBtn'));
 fileItems.prepend(button('查找操作','Search',()=>openCommands()));
 const mobileGroup=button('组合所选元素','Group',()=>{$('groupBtn').click();$('selectionMenu').hidden=true;}),mobileUngroup=button('拆分组合','Ungroup',()=>{$('ungroupBtn').click();$('selectionMenu').hidden=true;});
 mobileGroup.id='selectionGroup';mobileUngroup.id='selectionUngroup';$('selectionMenu').append(mobileGroup,mobileUngroup);
 document.addEventListener('pointerdown',e=>{if(!files.contains(e.target))files.open=false;});
 const inspector=document.querySelector('.inspector'),scroll=document.querySelector('.inspector-scroll');
 const original=[...scroll.children],layerSection=$('layers').closest('section'),canvasSection=$('bgColor').closest('section');
 const design=el('div','v4-inspector-panel'),layers=el('div','v4-inspector-panel'),history=el('div','v4-inspector-panel');
 design.id='designPanel';layers.id='layersPanel';history.id='historyPanel';
 const panels={design,layers,history};let inspectorTab='design';
 const overflowNotice=el('div','v4-overflow-notice'),overflowText=el('p','','选中元素超出画布，边缘部分不会出现在导出图中。'),fitSelection=button('适配到画布内','Maximize2',()=>E.fitSelectionToCanvas?.());
 overflowNotice.hidden=true;overflowNotice.append(overflowText,fitSelection);design.prepend(overflowNotice);
 const tabs=el('div','v4-inspector-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','属性面板');
 const tabButtons={};
 for(const [key,title,name]of [['design','设计','SlidersHorizontal'],['layers','图层','Layers'],['history','历史','History']]){
  const b=button(title,name,()=>showInspector(key));b.id='inspectorTab-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls',panels[key].id);tabButtons[key]=b;tabs.append(b);
  panels[key].setAttribute('role','tabpanel');panels[key].setAttribute('aria-labelledby',b.id);
 }
 tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const keys=Object.keys(panels),i=keys.indexOf(inspectorTab),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;showInspector(keys[next],false);tabButtons[keys[next]].focus();});
 document.querySelector('.inspector-title').after(tabs);
 original.forEach(n=>(n===layerSection?layers:design).append(n));scroll.append(design,layers,history);
 // Move live controls, retaining their IDs, event handlers and native input state.
 const fields=$('fields');
 function group(title,nodes,open=true){const d=el('details','v4-property-group');d.open=open;const s=el('summary','',title),body=el('div','v4-property-body');d.append(s,body);nodes.filter(Boolean).forEach(n=>body.append(n));fields.append(d);return d;}
 const textGroup=group('文字与字体',[$('textValue').parentElement,$('textFields')]);
 const transformGroup=group('位置与尺寸',[$('posX').closest('.pair'),$('objW').closest('.pair'),$('keepRatio').closest('label'),$('angle').closest('.pair')],false);
 group('颜色与描边',[$('fillColor').closest('label'),$('strokeColor').closest('label'),$('strokeWidth').closest('label')]);
 group('底色与投影',[$('objectEffects')],false);
 const imageGroup=group('图片与二维码',[$('imageTools'),$('editSelectedQR')]);
 const arrangeNodes=[...fields.children].filter(n=>!n.classList.contains('v4-property-group'));
 group('对齐与排列',arrangeNodes,false);
 design.insertBefore($('objectProps'),canvasSection);canvasSection.classList.add('v4-canvas-controls');
 const canvasTitle=el('h4','','画布背景');canvasSection.prepend(canvasTitle);
 const layerSearch=el('input','search');layerSearch.type='search';layerSearch.placeholder='查找图层名称…';layerSearch.setAttribute('aria-label','查找图层');layerSection.insertBefore(layerSearch,$('layers'));
 const layerEmpty=el('p','muted','没有匹配的图层');layerEmpty.hidden=true;layerSection.append(layerEmpty);
 const multiLayers=button('多选图层','Layers',()=>{E.setLayerMultiSelect?.(!E.getLayerMultiSelect?.());multiLayers.setAttribute('aria-pressed',String(!!E.getLayerMultiSelect?.()));});multiLayers.id='multiSelectLayers';multiLayers.setAttribute('aria-pressed','false');
 const layerGroup=button('组合','Group',()=>$('groupBtn').click()),layerUngroup=button('拆分','Ungroup',()=>$('ungroupBtn').click());
 layerGroup.id='layerGroupBtn';layerUngroup.id='layerUngroupBtn';const layerTools=el('div','v4-layer-tools');layerTools.append(multiLayers,layerGroup,layerUngroup);layerSearch.before(layerTools);
 function filterLayers(){let visible=0;document.querySelectorAll('#layers .layer').forEach(n=>{n.hidden=!n.querySelector('.layer-name')?.textContent.toLowerCase().includes(layerSearch.value.trim().toLowerCase());if(!n.hidden)visible++;});layerEmpty.hidden=visible>0;}
 layerSearch.oninput=filterLayers;new MutationObserver(filterLayers).observe($('layers'),{childList:true});
 const historyNote=el('p','muted','当前作品的操作记录。点击任一步回到该状态；之后的步骤仍可重做。重新打开作品时开始新的操作记录。');
 const historyList=el('ol','v4-history-list');history.append(historyNote,historyList);
 const historyEmpty=el('p','muted','新建作品后，编辑操作会出现在这里。');history.append(historyEmpty);
 function renderHistory(state){
  historyList.replaceChildren();historyEmpty.hidden=state.entries.length>0;
  for(const [i,entry]of [...state.entries.entries()].reverse()){
   const item=el('li'),b=button(entry.label||'编辑作品',entry.current?'Check':'History',async()=>{try{await E.goToHistory(entry.id);}catch(e){E.toast('恢复失败：'+e.message);}});
   b.classList.toggle('current',entry.current);b.classList.toggle('future',i>state.index);b.setAttribute('aria-current',entry.current?'step':'false');b.disabled=state.busy;
   b.append(el('small','',`第 ${entry.pageIndex+1} 页 · ${entry.pageCount} 页作品`));item.append(b);historyList.append(item);
  }
  $('undoBtn').title=state.canUndo?'撤销：'+(state.entries[state.index]?.label||'编辑')+' · Ctrl+Z':'没有可以撤销的操作';
  $('redoBtn').title=state.canRedo?'重做：'+(state.entries[state.index+1]?.label||'编辑'):'没有可以重做的操作';
  updateSelection();updatePageActions();
 }
 function showInspector(key,open=true){
  inspectorTab=key;for(const [name,panel]of Object.entries(panels)){panel.hidden=name!==key;tabButtons[name].setAttribute('aria-selected',String(name===key));tabButtons[name].tabIndex=name===key?0:-1;}
  if(open){document.body.classList.remove('show-library','focus-canvas');document.body.classList.add('show-properties');$('focusCanvasBtn')?.setAttribute('aria-pressed','false');}
 }
 showInspector('design',false);
 $('propertiesBtn').addEventListener('click',()=>showInspector('design'));
 $('selectionProps').addEventListener('click',()=>showInspector('design'));
 const historyBtn=button('操作历史','History',()=>showInspector('history'));historyBtn.id='historyBtn';document.querySelector('.toolbar>div').insertBefore(historyBtn,$('duplicateBtn'));
 const focusBtn=button('专注画布','Maximize2',()=>{document.body.classList.toggle('focus-canvas');const on=document.body.classList.contains('focus-canvas');focusBtn.setAttribute('aria-pressed',String(on));if(on)document.body.classList.remove('show-library','show-properties');});focusBtn.id='focusCanvasBtn';focusBtn.setAttribute('aria-pressed','false');document.querySelector('.bottom-bar>div').prepend(focusBtn);
 const overlay=el('button','v4-panel-scrim');overlay.type='button';overlay.setAttribute('aria-label','收起侧边面板');overlay.onclick=()=>document.body.classList.remove('show-library','show-properties');document.querySelector('.workspace').append(overlay);
 const guides=button('知识','BookOpen',()=>openGuides());guides.id='guidesBtn';guides.className='nav-btn';guides.replaceChildren(el('span'));guides.firstChild.append(icon('BookOpen',21));guides.append(document.createTextNode('知识'));$('settingsBtn').before(guides);
 const sizeSelect=$('sizePreset'),sizeValues=new Set([...sizeSelect.options].map(o=>o.value));
 for(const p of window.ZTH_DESIGN_GUIDES?.sizes||[]){const value=p.width+','+p.height;if(sizeValues.has(value))continue;const option=el('option','',p.name+' · '+p.width+' × '+p.height);option.value=value;sizeSelect.append(option);sizeValues.add(value);}
 const customSize=el('option','','自定义尺寸');customSize.value='custom';sizeSelect.prepend(customSize);const oldSizeChange=sizeSelect.onchange;sizeSelect.onchange=e=>{if(sizeSelect.value!=='custom')oldSizeChange?.call(sizeSelect,e);};
 function syncSizePreset(){const value=$('canvasW').value+','+$('canvasH').value;sizeSelect.value=sizeValues.has(value)?value:'custom';}
 $('resizeBtn').addEventListener('click',syncSizePreset);$('canvasW').addEventListener('input',syncSizePreset);$('canvasH').addEventListener('input',syncSizePreset);
 const swapSize=button('交换宽高','Grid2X2',()=>{const width=$('canvasW').value;$('canvasW').value=$('canvasH').value;$('canvasH').value=width;syncSizePreset();});swapSize.id='swapCanvasSize';swapSize.classList.add('wide');$('scaleContent').closest('label').before(swapSize);
 function animateLibrary(){if(document.documentElement.dataset.motion==='on')$('libraryBody').animate([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});}
 function openGuides(){document.querySelectorAll('nav .nav-btn').forEach(n=>n.classList.toggle('active',n===guides));$('panelTitle').textContent='尺寸与设计指南';$('libraryBody').replaceChildren();window.ZTH_DESIGN_GUIDES?.render($('libraryBody'),{onSelectSize:p=>{document.body.classList.remove('show-library');$('canvasW').value=p.width;$('canvasH').value=p.height;syncSizePreset();$('resizeDialog').showModal();}});document.body.classList.remove('show-properties','focus-canvas');document.body.classList.add('show-library');focusBtn.setAttribute('aria-pressed','false');animateLibrary();}
 function openLibrary(tab){E.openTab(tab);guides.classList.remove('active');document.body.classList.remove('focus-canvas','show-properties');document.body.classList.add('show-library');focusBtn.setAttribute('aria-pressed','false');animateLibrary();}
 document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;guides.classList.remove('active');document.body.classList.remove('focus-canvas','show-properties');document.body.classList.add('show-library');focusBtn.setAttribute('aria-pressed','false');animateLibrary();});
 const empty=el('div','v4-empty-canvas');empty.append(el('small','','空白，也是一种开始'),el('h2','','把第一个想法放上画布'),el('p','','添加文字、选择素材，或用一套模板开始。'));
 const emptyActions=el('div');emptyActions.append(button('添加文字','Type',()=>openLibrary('text')),button('浏览模板','LayoutTemplate',()=>openLibrary('templates')));empty.append(emptyActions);$('stage').append(empty);
 const exportWarning=el('p','v4-export-warning');exportWarning.hidden=true;$('exportInfo').before(exportWarning);
 function outsideCanvas(o){const r=o.getBoundingRect(),s=E.getSize();return r.left<-.5||r.top<-.5||r.left+r.width>s.width+.5||r.top+r.height>s.height+.5;}
 function updateExportWarning(){const count=C.getObjects().filter(o=>o.visible!==false&&outsideCanvas(o)).length;exportWarning.hidden=!count;exportWarning.textContent=count+' 个元素超出画布，超出的部分会被裁掉。若这是留出血或装饰延伸，可继续导出；否则请返回选中元素并适配画布。';}
 $('exportBtn').addEventListener('click',updateExportWarning);
 function updateSelection(){
  const o=C.getActiveObject(),has=!!o;document.body.classList.toggle('has-selection',has);
  textGroup.hidden=!o||!['textbox','text','i-text'].includes(o.type);
  imageGroup.hidden=!o||o.type!=='image'&&o.role!=='qr';empty.hidden=C.getObjects().length>0;
  overflowNotice.hidden=!o||!outsideCanvas(o);fitSelection.disabled=!o||!E.canEdit(o,{silent:true});
  for(const id of ['duplicateBtn','deleteBtn','groupBtn','ungroupBtn']){const b=$(id);if(b)b.disabled=!has||!E.canEdit(o,{silent:true});}
  if(has){$('groupBtn').disabled=o.type!=='activeselection'||!E.canEdit(o,{silent:true});$('ungroupBtn').disabled=o.type!=='group'||!E.canEdit(o,{silent:true});}
  mobileGroup.disabled=$('groupBtn').disabled;mobileUngroup.disabled=$('ungroupBtn').disabled;
  layerGroup.disabled=$('groupBtn').disabled;layerUngroup.disabled=$('ungroupBtn').disabled;multiLayers.setAttribute('aria-pressed',String(!!E.getLayerMultiSelect?.()));
 }
 C.on('selection:created',updateSelection);C.on('selection:updated',updateSelection);C.on('selection:cleared',updateSelection);C.on('object:modified',updateSelection);C.on('object:added',()=>queueMicrotask(updateSelection));C.on('object:removed',()=>queueMicrotask(updateSelection));
 const pageStrip=el('div','v4-page-strip');$('pages').before(pageStrip);pageStrip.append($('pages'));
 const pageActions=el('div','v4-page-actions');pageStrip.append(pageActions);
 const duplicatePage=button('复制页面','Copy',()=>E.duplicatePage?.().catch(e=>E.toast(e.message)));
 const deletePage=button('删除当前页','Trash2',()=>E.deletePage?.().catch(e=>E.toast(e.message)));
 pageActions.append(duplicatePage,deletePage);
 function updatePageActions(){const busy=E.isBusy?.()||false;duplicatePage.disabled=busy;deletePage.disabled=busy||(E.getPages?.().length||1)<2;}
 // A command palette makes hidden desktop actions reachable on small screens too.
 const commandDialog=el('dialog','v4-command-dialog');commandDialog.id='commandDialog';
 const commandHead=el('div','v4-command-head');const commandInput=el('input');commandInput.type='search';commandInput.placeholder='搜索操作、工具或快捷键…';commandInput.setAttribute('aria-label','搜索操作');commandHead.append(icon('Search',21),commandInput,button('关闭','X',()=>commandDialog.close()));
 const commandResults=el('div','v4-command-results');commandDialog.append(commandHead,commandResults,el('p','muted','↑ ↓ 选择 · Enter 执行 · Esc 关闭'));document.body.append(commandDialog);
 const actions=[
  ['新建空白草稿','FilePlus2','',()=>$('newDraftBtn').click()],['我的作品与回收站','FolderOpen','',()=>$('worksBtn').click()],['保存到我的作品','Save','Ctrl+S',()=>quickSave.click()],['备份工程文件','Save','Ctrl+Shift+S',()=>$('saveBtn').click()],['打开工程 / 导入图片','FolderOpen','',()=>$('openBtn').click()],['导出图片与 PDF','Download','',()=>$('exportBtn').click()],
  ['撤销上一步','Undo2','Ctrl+Z',()=>E.undo?.()],['重做下一步','Redo2','Ctrl+Shift+Z',()=>E.redo?.()],['操作历史','History','',()=>showInspector('history')],['图层与查找','Layers','',()=>showInspector('layers')],['调整画布尺寸','Grid2X2','',()=>$('resizeBtn').click()],['尺寸与设计知识','BookOpen','',openGuides],['专注画布 / 恢复面板','Maximize2','',()=>focusBtn.click()],
  ['添加文字','Type','',()=>openLibrary('text')],['箭头 / 符号 / 工具素材','Shapes','',()=>openLibrary('elements')],['浏览模板','LayoutTemplate','',()=>openLibrary('templates')],['偏好设置与动效','Settings2','',()=>$('settingsBtn').click()]
 ];
 let activeCommand=0,commandMatches=[];
 function selectCommand(i){activeCommand=Math.max(0,Math.min(i,commandMatches.length-1));[...commandResults.children].forEach((b,j)=>b.classList.toggle('active',j===activeCommand));commandResults.children[activeCommand]?.scrollIntoView({block:'nearest'});}
 function runCommand(i){const action=commandMatches[i];if(!action)return;commandDialog.close();Promise.resolve(action[3]()).catch(e=>E.toast(e.message));}
 function renderCommands(){const query=commandInput.value.trim().toLowerCase();commandMatches=actions.filter(a=>(a[0]+' '+a[2]).toLowerCase().includes(query));commandResults.replaceChildren();commandMatches.forEach((a,i)=>{const b=button(a[0],a[1],()=>runCommand(i));b.append(el('kbd','',a[2]));commandResults.append(b);});if(!commandMatches.length)commandResults.append(el('p','muted','没有匹配的操作，试试“图层”“尺寸”或“保存”。'));selectCommand(0);}
 function openCommands(){if(document.querySelector('dialog[open]'))return;commandInput.value='';commandDialog.showModal();renderCommands();commandInput.focus();}
 commandInput.oninput=renderCommands;commandInput.onkeydown=e=>{if(['ArrowDown','ArrowUp','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Enter')runCommand(activeCommand);else selectCommand(activeCommand+(e.key==='ArrowDown'?1:-1));}};
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommands();}if(e.key==='Escape'&&!document.querySelector('dialog[open]')){document.body.classList.remove('show-library','show-properties','focus-canvas');files.open=false;focusBtn.setAttribute('aria-pressed','false');}});
 // Keep the overlay and keyboard focus available without affecting the artboard.
 document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});});
 E.subscribeHistory?.(renderHistory);updateSelection();updatePageActions();filterLayers();
 window.ZTH_WORKSPACE={showInspector,openCommands,openGuides};
}
start();
})();
