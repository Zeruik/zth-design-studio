'use strict';
(function(){
const $=id=>document.getElementById(id),E=ZTH_EDITOR,F=fabric;let templates=[],replacement=null;
const ready=E.dbGet('userTemplates').then(v=>{templates=Array.isArray(v)?v:[];}).catch(()=>{});
function capture(){const d=JSON.parse(JSON.stringify(E.getProject()));d.kind='template';d.name=$('templateName').value.trim();return d;}
function openSave(){if(!$('templateName').value)$('templateName').value=$('projectName').value;$('templateDialog').showModal();}
$('saveUserTemplate').onclick=async()=>{if(!$('templateName').value.trim())return E.toast('请填写模板名称');const doc=capture(),thumb=E.canvas.toDataURL({format:'png',multiplier:Math.min(1,240/E.canvas.getWidth())});const item={id:'user-'+Date.now(),name:doc.name,category:'我的模板',document:doc,thumb};templates.push(item);try{await E.dbPut('userTemplates',templates);$('templateDialog').close();E.openTab('templates');E.toast('模板已保存到此设备');}catch{templates.pop();E.toast('模板保存失败，请导出模板备份');}};
$('exportUserTemplate').onclick=async()=>{if(!$('templateName').value.trim())return E.toast('请填写模板名称');const doc=capture(),name=doc.name.replace(/[\\/:*?"<>|]/g,'-');await E.download(new Blob([JSON.stringify(doc)],{type:'application/json'}),name+'.zthpmsj');$('templateDialog').close();};
$('replaceImageBtn').onclick=()=>{replacement=E.canvas.getActiveObject();if(!E.canEdit(replacement))return;if(replacement?.type!=='image')return E.toast('先添加图片，再设为图片槽。');$('replaceImageInput').click();};
async function replaceWithFile(file,o){if(!file||!o)return;if(!E.canEdit(o)||!E.canvas.getObjects().includes(o))return;try{if(file.size>25e6)throw Error('单张图片请小于 25 MB');let url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const test=new Image();test.src=url;await test.decode();if(test.naturalWidth*test.naturalHeight>24000000)throw Error('单张图片请小于 2400 万像素');if(!E.canEdit(o)||!E.canvas.getObjects().includes(o))return;const fw=o.width*o.scaleX,fh=o.height*o.scaleY;o.setElement(test);let sc=Math.max(fw/o.width,fh/o.height),cw=fw/sc,ch=fh/sc;o.set({cropX:(o.width-cw)/2,cropY:(o.height-ch)/2,width:cw,height:ch,scaleX:sc,scaleY:sc});o.setCoords();E.canvas.requestRenderAll();E.changed();E.toast('图片已替换，品牌与版式保持原位');}catch(err){E.toast(err.message);}}
$('replaceImageInput').onchange=async e=>{const f=e.target.files[0];e.target.value='';await replaceWithFile(f,replacement);};

$('imageSlot').onchange=()=>{const o=E.canvas.getActiveObject();if(!E.canEdit(o)){ $('imageSlot').checked=!!o?.imageSlot;return;}o.imageSlot=$('imageSlot').checked;if(o.imageSlot)o.role='photo';E.changed();};$('keepRatio').onchange=()=>{const o=E.canvas.getActiveObject();if(!E.canEdit(o)){ $('keepRatio').checked=o?.keepRatio??o?.type==='image';return;}o.keepRatio=$('keepRatio').checked;E.changed();};
const previewCache=new Map();let previewQueue=Promise.resolve(),libraryObserver;
function dimensions(t){const s=t.document?.pages?.[0];return{width:t.width||s?.width||t.build().width,height:t.height||s?.height||t.build().height};}
function makeElement(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;}
async function preview(t,img){
 if(t.thumb){img.src=t.thumb;return;}
 if(!previewCache.has(t.id)){
  const job=previewQueue.then(async()=>{
   await window.ZTH_FONTS?.ready;
   const s=t.document?.pages?.[0]||t.build(),scale=Math.min(420/s.width,480/s.height),el=document.createElement('canvas');
   const c=new F.StaticCanvas(el,{width:Math.max(1,Math.round(s.width*scale)),height:Math.max(1,Math.round(s.height*scale)),enableRetinaScaling:false});
   try{c.setZoom(scale);if(t.document)await c.loadFromJSON(s.canvas);else{c.backgroundColor=s.background;for(const d of s.objects)c.add(await E.sceneObject(d));}c.renderAll();return c.toDataURL({format:'png'});}finally{await c.dispose();}
  });
  previewCache.set(t.id,job);previewQueue=job.catch(()=>{});job.catch(()=>previewCache.delete(t.id));
 }
 img.src=await previewCache.get(t.id);
}
function templateDetails(t){
 const d=dimensions(t),reduce=(a,b)=>b?reduce(b,a%b):a,g=reduce(d.width,d.height);
 return {...d,ratio:t.ratio||d.width/g+':'+d.height/g,purpose:t.purpose||(t.document?'个人模板':t.category),sizeLabel:t.sizeLabel||d.width+' × '+d.height+' px',copyTips:t.copyTips||['模板会创建独立副本，原件保持不变。','替换文字与图片后，请检查行距、换行与裁切。'],layoutTips:t.layoutTips||'保留原有信息层级，也可以按用途重新组织内容。',exportTip:t.exportTip||'保存可编辑工程后再导出；按目标设备或印刷要求检查尺寸。'};
}
function applyFromLibrary(t){return Promise.resolve(E.applyTemplate(t)).catch(e=>E.toast('模板打开失败：'+e.message));}
function showDetails(t){
 const meta=templateDetails(t),dialog=makeElement('dialog','template-v4-detail'),head=makeElement('div','template-v4-detail-head'),title=makeElement('h2','',t.name),close=makeElement('button','','关闭'),layout=makeElement('div','template-v4-detail-layout'),img=makeElement('img','template-v4-detail-image'),info=makeElement('div','template-v4-detail-info');
 const titleId='template-v4-title-'+String(t.id).replace(/[^a-z0-9-]/gi,'');title.id=titleId;dialog.setAttribute('aria-labelledby',titleId);close.type='button';close.onclick=()=>dialog.close();head.append(title,close);img.alt=t.name+' 完整预览';
 info.append(makeElement('p','template-v4-purpose',meta.purpose),makeElement('p','',meta.sizeLabel+' · '+meta.ratio),makeElement('h3','','排版思路'),makeElement('p','',meta.layoutTips),makeElement('h3','','文字建议'));
 const tips=makeElement('ul','');meta.copyTips.forEach(tip=>tips.append(makeElement('li','',tip)));info.append(tips,makeElement('h3','','导出提示'),makeElement('p','',meta.exportTip));
 const apply=makeElement('button','primary wide','用此模板创建副本');apply.type='button';apply.onclick=()=>{dialog.close();applyFromLibrary(t);};info.append(apply);layout.append(img,info);dialog.append(head,layout);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();preview(t,img).catch(()=>{img.alt='预览暂不可用，可继续创建模板副本';});
}
function renderLibrary(body){
 libraryObserver?.disconnect();libraryObserver=null;
 const search=makeElement('input','search'),filters=makeElement('div','template-v4-filters'),category=makeElement('select','template-v4-select'),shape=makeElement('select','template-v4-select'),purpose=makeElement('select','template-v4-select'),actions=makeElement('div','template-actions'),count=makeElement('p','library-note'),grid=makeElement('div','template-grid template-v4-grid');
 search.type='search';search.placeholder='搜索模板、用途或尺寸';search.setAttribute('aria-label','搜索模板');category.setAttribute('aria-label','模板分类');shape.setAttribute('aria-label','画面方向和比例');purpose.setAttribute('aria-label','模板用途');count.setAttribute('aria-live','polite');
 const all=[...ZTH_TEMPLATES,...templates.map(t=>({...t,...dimensions(t),purpose:'个人模板'}))];
 const options=(select,rows)=>{for(const[value,label]of rows){const opt=makeElement('option','',label);opt.value=value;select.append(opt);}};
 options(category,['全部',...new Set(all.map(t=>t.category))].map(x=>[x,x==='全部'?'所有分类':x]));options(purpose,['全部',...new Set(all.map(t=>t.purpose).filter(Boolean))].map(x=>[x,x==='全部'?'所有用途':x]));options(shape,[['all','所有比例'],['landscape','横版'],['portrait','竖版'],['square','方形'],['wide','宽幅 ≥ 2:1'],['long','长图 ≥ 1:2']]);
 for(const label of ['保存当前为模板','导出当前模板']){const b=makeElement('button','',label);b.type='button';b.onclick=openSave;actions.append(b);}
 filters.append(category,shape,purpose);body.append(search,filters,actions,count,grid,makeElement('p','library-note','原模板保持只读。查看用途与文字建议，或直接创建自己的副本。示例信息使用前请核对。'));
 function draw(){
  libraryObserver?.disconnect();grid.replaceChildren();
  const choices=all.filter(t=>window.ZTH_DESIGN_GUIDES?ZTH_DESIGN_GUIDES.matchesTemplate(t,{query:search.value,category:category.value,orientation:shape.value,purpose:purpose.value}):(category.value==='全部'||t.category===category.value)&&(purpose.value==='全部'||t.purpose===purpose.value)&&(shape.value==='all'||shape.value==='square'&&t.width===t.height||shape.value==='landscape'&&t.width>t.height||shape.value==='portrait'&&t.height>t.width||shape.value==='wide'&&t.width/t.height>=2||shape.value==='long'&&t.height/t.width>=2)&&[t.name,t.category,t.purpose,t.width+'',t.height+''].join(' ').includes(search.value.trim()));
  count.textContent=choices.length+' 套模板';
  if(!choices.length){grid.append(makeElement('p','library-note','没有匹配模板，试试放宽筛选。'));return;}
  const pending=new Map();if('IntersectionObserver'in window)libraryObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const t=pending.get(entry.target);if(t){preview(t,entry.target).catch(()=>{entry.target.alt='预览暂不可用';});pending.delete(entry.target);}libraryObserver.unobserve(entry.target);}},{rootMargin:'240px'});
  for(const t of choices){const meta=templateDetails(t),card=makeElement('article','template-v4-card'),inspect=makeElement('button','template-card'),img=makeElement('img',''),name=makeElement('b','',t.name),small=makeElement('small','',meta.width+' × '+meta.height+' · '+meta.purpose),row=makeElement('div','template-v4-card-actions'),details=makeElement('button','','用途与预览'),apply=makeElement('button','','使用模板');
   img.alt=t.name;img.loading='lazy';img.width=210;img.height=200;inspect.type=details.type=apply.type='button';inspect.setAttribute('aria-label','预览 '+t.name);inspect.onclick=details.onclick=()=>showDetails(t);apply.onclick=()=>applyFromLibrary(t);inspect.append(img,name,small);row.append(details,apply);card.append(inspect,row);grid.append(card);if(libraryObserver){pending.set(img,t);libraryObserver.observe(img);}else preview(t,img).catch(()=>{img.alt='预览暂不可用';});
  }
 }
 search.oninput=category.onchange=shape.onchange=purpose.onchange=draw;draw();
}
window.ZTH_TEMPLATE={ready,openSave,replaceWithFile,renderLibrary,showDetails,templateDetails,list:()=>templates,remove:async id=>{templates=templates.filter(t=>t.id!==id);await E.dbPut('userTemplates',templates);E.openTab('templates');}};
})();
