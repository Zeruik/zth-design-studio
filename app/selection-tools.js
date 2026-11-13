'use strict';
(function(){
  const E=ZTH_EDITOR,C=E.canvas,$=id=>document.getElementById(id),bar=$('selectionBar');
  let qrTarget=null,qrSession=0,qrPending=false,uploadRequest=null;
  function refresh(){
    const o=C.getActiveObject();bar.hidden=!o;$('selectionMenu').hidden=true;
    if(!o){$('editSelectedQR').hidden=true;return;}
    $('selectionSummary').textContent=(o.locked?'🔒 ':'')+(o.name||'元素')+' · '+Math.round(o.getScaledWidth())+' × '+Math.round(o.getScaledHeight())+' px';
    $('quickColor').hidden=!['textbox','text','i-text','rect','circle','triangle','path','polygon','line'].includes(o.type);
    const strokeInk=(o.elementPaint==='stroke'||o.type==='line')&&(!o.fill||o.fill==='transparent');
    $('quickColor').value=ZTH_COLORS.normalize(strokeInk?o.stroke:o.fill)||'#000000';
    $('selectionReplace').hidden=o.type!=='image'&&o.role!=='qr';
    $('selectionQR').hidden=o.role!=='qr';$('editSelectedQR').hidden=o.role!=='qr';
    $('selectionLock').textContent=o.locked?'解锁元素':'锁定元素';
  }
  function properties(){document.body.classList.remove('show-library');document.body.classList.add('show-properties');$('selectionMenu').hidden=true;$('objectProps').scrollIntoView({block:'nearest'});}
  $('selectionMore').onclick=()=>{$('selectionMenu').hidden=!$('selectionMenu').hidden;};$('selectionProps').onclick=properties;
  $('selectionLock').onclick=()=>$('lockBtn').click();$('selectionDuplicate').onclick=()=>$('duplicateBtn').click();$('selectionDelete').onclick=()=>$('deleteBtn').click();
  $('quickColor').onchange=()=>{const o=C.getActiveObject();if(!E.canEdit(o))return;const value=$('quickColor').value;if(window.ZTH_EFFECTS){if(!ZTH_EFFECTS.paint(o,'ink',value))return;C.requestRenderAll();E.changed();}else{const strokeInk=(o.elementPaint==='stroke'||o.type==='line')&&(!o.fill||o.fill==='transparent');o.set(strokeInk?'stroke':'fill',value);C.requestRenderAll();E.changed();}};
  function pending(value){qrPending=value;$('applySelectedQR').disabled=value;$('uploadSelectedQR').disabled=value;}
  function openQR(){
    const o=C.getActiveObject();if(o?.role!=='qr'||!C.getObjects().includes(o)||!E.canEdit(o))return;
    qrTarget=o;qrSession++;pending(false);
    $('selectedQRText').value=o.qrText||'';
    $('selectedQRDark').value=ZTH_COLORS.normalize(o.qrDark)||'#142c4a';
    $('selectedQRLight').value=ZTH_COLORS.normalize(o.qrLight)||'#ffffff';
    $('qrEditDialog').showModal();$('selectionMenu').hidden=true;
  }
  $('qrEditDialog').addEventListener('close',()=>{qrSession++;qrTarget=null;uploadRequest=null;pending(false);});
  $('selectionQR').onclick=openQR;$('editSelectedQR').onclick=openQR;
  $('selectionReplace').onclick=()=>{if(C.getActiveObject()?.role==='qr')openQR();else $('replaceImageBtn').click();};
  const request=()=>({target:qrTarget,session:qrSession});
  function isCurrent(job){return job.session===qrSession&&job.target===qrTarget;}
  async function replaceQR(src,text,job,colors={}){
    if(!isCurrent(job))return false;
    const old=job.target;
    if(!old||!C.getObjects().includes(old)||!E.canEdit(old))throw Error('请重新选中可编辑的二维码');
    const image=await fabric.FabricImage.fromURL(src);
    // Loading is asynchronous: a closed dialog, new document or newly locked
    // element must not let an earlier request replace a different selection.
    if(!isCurrent(job))return false;
    if(!C.getObjects().includes(old)||!E.canEdit(old))throw Error('二维码已更改，请重新选中后再试');
    const index=C.getObjects().indexOf(old),size=Math.min(old.getScaledWidth(),old.getScaledHeight());
    image.set({left:old.left,top:old.top,angle:old.angle,originX:old.originX,originY:old.originY,scaleX:size/image.width,scaleY:size/image.height,opacity:old.opacity,flipX:old.flipX,flipY:old.flipY,name:'二维码',role:'qr',qrText:text||'',qrDark:colors.dark||'',qrLight:colors.light||'',keepRatio:true});
    C.remove(old);C.insertAt(index,image);C.setActiveObject(image);image.setCoords();C.requestRenderAll();E.changed();$('qrEditDialog').close();E.toast('二维码已替换，请在导出后扫码检查');return true;
  }
  $('applySelectedQR').onclick=async()=>{
    if(qrPending)return;
    const text=$('selectedQRText').value.trim();
    if(!text||text.length>1500)return E.toast('请填写 1–1500 字符的网址或文字');
    const job=request(),colors={dark:$('selectedQRDark').value,light:$('selectedQRLight').value};
    pending(true);
    try{await replaceQR(await window.makeQR(text,colors),text,job,colors);}
    catch(e){if(isCurrent(job))E.toast('二维码生成失败：'+e.message);}
    finally{if(isCurrent(job))pending(false);}
  };
  $('uploadSelectedQR').onclick=()=>{if(qrPending)return;uploadRequest=request();$('qrImageInput').click();};
  $('qrImageInput').onchange=async e=>{
    const file=e.target.files[0],job=uploadRequest;e.target.value='';uploadRequest=null;
    if(!file||!job||!isCurrent(job)||qrPending)return;
    pending(true);
    try{
      if(file.size>25e6)throw Error('图片请小于 25 MB');
      if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('支持 PNG / JPG / WebP 二维码图片');
      const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
      const im=new Image();im.src=src;await im.decode();
      if(im.naturalWidth*im.naturalHeight>24000000)throw Error('图片请小于 2400 万像素');
      if(Math.abs(im.naturalWidth/im.naturalHeight-1)>.08)throw Error('请先将二维码裁为正方形，以免变形影响扫描');
      await replaceQR(src,'',job);
    }catch(e){if(isCurrent(job))E.toast(e.message);}
    finally{if(isCurrent(job))pending(false);}
  };
  for(const event of ['selection:created','selection:updated','selection:cleared','object:modified','object:scaling'])C.on(event,refresh);
  window.ZTH_SELECTION={refresh,properties};
})();
