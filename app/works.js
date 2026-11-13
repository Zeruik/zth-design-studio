'use strict';
(function(){
  const E=ZTH_EDITOR,$=id=>document.getElementById(id);let queue=Promise.resolve(),latestSave=0;
  const clone=d=>JSON.parse(JSON.stringify(d));
  const enqueue=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
  const dialog=$('worksDialog'),list=$('worksList');
  function thumbnail(){return E.canvas.toDataURL({format:'png',multiplier:Math.min(1,260/E.canvas.getWidth())});}
  async function compact(doc){
    const copy=clone(doc);
    // Custom native schemes may lack Web Crypto. Font deduplication is optional;
    // retaining the embedded font keeps history and exported projects portable.
    if(copy.fonts?.[0]?.src&&globalThis.crypto?.subtle?.digest){
      let hash;try{const bytes=new TextEncoder().encode(copy.fonts[0].src);hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');}catch{return copy;}
      await E.dbPut('font:'+hash,copy.fonts);copy.fontKey=hash;delete copy.fonts;
    }
    return copy;
  }
  async function expand(doc){const copy=clone(doc);if(copy.fontKey)copy.fonts=await E.dbGet('font:'+copy.fontKey);delete copy.fontKey;return copy;}
  function save(checkpoint=false){
    const doc=clone(E.getProject()),thumb=thumbnail(),sequence=++latestSave;
    return enqueue(async()=>{
      const data=await compact(doc);let item=await E.dbGet('work:'+doc.workId)||{id:doc.workId,createdAt:doc.savedAt,revisions:[]};
      item.document=data;item.thumb=thumb;item.name=doc.name;item.updatedAt=doc.savedAt;
      if(checkpoint){item.revisions.unshift({at:doc.savedAt,document:data,thumb});item.revisions=item.revisions.slice(0,10);}
      await E.dbPut('work:'+doc.workId,item);
      let index=await E.dbGet('works-index')||[];index=index.filter(x=>x.id!==doc.workId);index.unshift({id:doc.workId,name:doc.name,updatedAt:doc.savedAt,thumb});await E.dbPut('works-index',index);
      // A completed manual save/restore must survive an immediate reload, without
      // waiting for the editor's debounce. Keep fonts embedded for startup recovery.
      // Older queued checkpoints still enter history, but cannot replace the startup
      // document after a newer save or a switch to another canvas has occurred.
      if(sequence===latestSave){const current=clone(E.getProject());if(current.workId===doc.workId)await E.dbPut('autosave',current);}
      return item;
    });
  }
  async function openDocument(doc){await save(true);await E.loadProject(await expand(doc));await save();dialog.close();document.body.classList.remove('show-library','show-properties');E.toast('作品已恢复，之前的状态已留在历史中');}
  const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>Promise.resolve().then(fn).catch(e=>E.toast('操作失败：'+e.message));return b;};
  async function render(){await queue;const index=await E.dbGet('works-index')||[];list.replaceChildren();if(!index.length){const p=document.createElement('p');p.textContent='还没有保存的作品。点击“保存到我的作品”开始。';list.append(p);return;}for(const meta of index){const card=document.createElement('article');card.className='work-card';const image=document.createElement('img');image.src=meta.thumb;image.alt=meta.name;const body=document.createElement('div'),name=document.createElement('h3'),time=document.createElement('p');name.textContent=meta.name||'未命名作品';time.textContent=new Date(meta.updatedAt).toLocaleString();const actions=document.createElement('div');actions.className='row';actions.append(button('继续编辑',async()=>{const item=await E.dbGet('work:'+meta.id);await openDocument(item.document);}),button('版本记录',()=>versions(meta.id)),button('导出工程',async()=>{const item=await E.dbGet('work:'+meta.id);const doc=await expand(item.document);await E.download(new Blob([JSON.stringify(doc)],{type:'application/json'}),(meta.name||'ZTH-design').replace(/[\\/:*?"<>|]/g,'-')+'.zthpmsj');}));body.append(name,time,actions);card.append(image,body);list.append(card);}}
  async function versions(id){const item=await E.dbGet('work:'+id);list.replaceChildren(button('← 返回我的作品',render));const title=document.createElement('h3');title.textContent=item.name+' · 最近 10 个保存版本';list.append(title);if(!item.revisions.length){const p=document.createElement('p');p.textContent='尚无手动保存版本，当前草稿仍在自动保存。';list.append(p);}item.revisions.forEach((r,i)=>{const row=document.createElement('article');row.className='work-card';const img=document.createElement('img');img.src=r.thumb;img.alt='历史版本 '+(i+1);const b=button(new Date(r.at).toLocaleString()+' · 恢复此版本',()=>openDocument(r.document));row.append(img,b);list.append(row);});}
  $('worksBtn').onclick=async()=>{$('workName').value=$('projectName').value;dialog.showModal();try{await save();await render();}catch(e){E.toast('作品历史读取失败，请导出工程备份：'+e.message);}};
  $('saveLocalWork').onclick=async()=>{try{$('projectName').value=$('workName').value.trim()||'未命名作品';E.changed();await save(true);await render();E.toast('作品及版本已保存到此设备');}catch(e){E.toast('本地保存失败，请导出工程备份：'+e.message);}};
  $('workName').onchange=()=>{$('projectName').value=$('workName').value.trim()||'未命名作品';E.changed();};
  dialog.addEventListener('close',()=>list.replaceChildren());
  window.ZTH_WORKS={save,openDocument,render,ready:Promise.resolve()};
})();
