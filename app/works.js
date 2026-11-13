'use strict';
(function(root){
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const id=()=>globalThis.crypto?.randomUUID?.()||'work-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function isPristine(doc){
    const page=doc?.pages?.[0],background=page?.canvas?.background;
    return doc?.pages?.length===1&&page.width===1080&&page.height===1440&&!(page.canvas?.objects?.length)&&
      [undefined,'','#ffffff','#fff','white'].includes(background)&&['','未命名作品','空白草稿','Untitled'].includes(doc.name||'');
  }
  function createStore(E){
    let queue=Promise.resolve(),latestSave=0,lastTrashId=null;
    const serials=new Map(),generations=new Map(),blocked=new Set();
    const ready=E.dbGet('work-states').then(states=>{for(const [key,state] of Object.entries(states||{}))generations.set(key,state.generation||0);});
    const serial=key=>serials.get(key)||0;
    const enqueue=fn=>{const result=queue.then(fn);queue=result.catch(()=>{});return result;};
    const atomic=E.dbAtomic?((keys,fn)=>E.dbAtomic(keys,fn)):async(keys,fn)=>{
      const values={};for(const key of keys)values[key]=await E.dbGet(key);
      const plan=fn(values)||{};for(const [key,value] of plan.puts||[])await E.dbPut(key,value);
      for(const key of plan.deletes||[])if(E.dbDelete)await E.dbDelete(key);else await E.dbPut(key,undefined);
      return plan.value;
    };
    const metadata=item=>({id:item.id,name:item.name,updatedAt:item.updatedAt,thumb:item.thumb});
    const thumbnail=()=>E.canvas.toDataURL({format:'png',multiplier:Math.min(1,260/E.canvas.getWidth())});
    async function compact(doc){
      const copy=clone(doc);
      if(copy.fonts?.length&&globalThis.crypto?.subtle?.digest){
        let hash;try{const bytes=new TextEncoder().encode(JSON.stringify(copy.fonts));hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');}catch{return {document:copy};}
        const font=['font:'+hash,copy.fonts];copy.fontKey=hash;delete copy.fonts;return {document:copy,font};
      }
      return {document:copy};
    }
    async function expand(doc){const copy=clone(doc);if(copy.fontKey){copy.fonts=await E.dbGet('font:'+copy.fontKey);if(!copy.fonts)throw Error('作品字体缓存缺失，请从导出的工程备份恢复');delete copy.fontKey;}return copy;}
    async function activate(workId){await ready;const states=await E.dbGet('work-states');generations.set(workId,states?.[workId]?.generation||0);blocked.delete(workId);}
    function save(checkpoint=false,{asCopy=false}={}){
      // A close/save click during undo or page hydration must capture the final
      // visible document, not the canvas halfway through its async replacement.
      if(E.hasPendingOperations?.())return E.whenIdle().then(()=>save(checkpoint,{asCopy}));
      const doc=clone(E.getProject());if(asCopy){doc.workId=id();doc.name=(doc.name||'未命名作品')+' · 冲突副本';}
      const thumb=thumbnail(),sequence=++latestSave,token=serial(doc.workId);
      return enqueue(async()=>{
        await ready;const workId=doc.workId,generation=generations.get(workId)||0;let committedGeneration=generation;
        if(blocked.has(workId)||token!==serial(workId))return {skipped:true};
        const packed=await compact(doc);
        const result=await atomic(['work:'+workId,'works-index','work-states'],values=>{
          const states=clone(values['work-states']||{}),state=states[workId]||{generation:0};
          if(blocked.has(workId)||token!==serial(workId)||state.deleted||(state.generation||0)!==generation)return {value:{skipped:true}};
          const current=clone(E.getProject()),puts=[];
          if(sequence===latestSave&&current.workId===workId)puts.push(['autosave',current]);
          committedGeneration=generation+1;states[workId]={generation:committedGeneration,deleted:false};
          if(isPristine(doc)&&!checkpoint&&!values['work:'+workId])return {puts:[...puts,['work-states',states]],value:{draft:true}};
          const item=clone(values['work:'+workId])||{id:workId,createdAt:doc.savedAt,revisions:[]};
          Object.assign(item,{document:packed.document,thumb,name:doc.name,updatedAt:doc.savedAt});
          if(checkpoint){item.revisions.unshift({at:doc.savedAt,document:packed.document,thumb});item.revisions=item.revisions.slice(0,10);}
          const index=[metadata(item),...(values['works-index']||[]).filter(entry=>entry.id!==workId)];
          if(packed.font)puts.push(packed.font);
          puts.push(['work:'+workId,item],['works-index',index],['work-states',states]);
          return {puts,value:item};
        });
        if(!result?.skipped)generations.set(workId,committedGeneration);
        // A user may edit while the first transaction is committing. Finish with
        // the newest live draft, but only if this save still owns that work.
        if(!result?.skipped&&sequence===latestSave&&token===serial(workId)&&!blocked.has(workId))await atomic(['work-states'],values=>{
          const state=values['work-states']?.[workId]||{generation:0},current=clone(E.getProject());
          if(sequence!==latestSave||token!==serial(workId)||blocked.has(workId)||state.deleted||(state.generation||0)!==committedGeneration||current.workId!==workId)return {};
          return {puts:[['autosave',current]]};
        });
        return result;
      });
    }
    function moveToTrash(workId,{discard=false}={}){
      const live=clone(E.getProject()),active=live.workId===workId,captured=active?live:null,thumb=active?thumbnail():null;
      E.cancelAutosave?.();serials.set(workId,serial(workId)+1);blocked.add(workId);++latestSave;
      const trashId=id(),deletedAt=new Date().toISOString();
      return enqueue(async()=>{
        await ready;const packed=captured?await compact(captured):null;
        const result=await atomic(['work:'+workId,'works-index','work-states','trash-index','autosave'],values=>{
          const states=clone(values['work-states']||{}),state=states[workId]||{generation:0},generation=(state.generation||0)+1;
          let item=clone(values['work:'+workId]);
          if(captured&&(item||!isPristine(captured))){
            item=item||{id:workId,createdAt:captured.savedAt,revisions:[]};
            Object.assign(item,{document:packed.document,name:captured.name,updatedAt:captured.savedAt,thumb});
          }
          const puts=[],deletes=[],index=(values['works-index']||[]).filter(entry=>entry.id!==workId);
          const checkpoint=discard&&item?.revisions?.[0],restoreAsCopy=!!checkpoint;
          if(checkpoint){
            const saved={...item,document:clone(checkpoint.document),name:checkpoint.document.name,thumb:checkpoint.thumb,updatedAt:checkpoint.at};
            puts.push(['work:'+workId,saved]);index.unshift(metadata(saved));
          }else deletes.push('work:'+workId);
          states[workId]={generation,deleted:!checkpoint,changedAt:deletedAt};
          if(values.autosave?.workId===workId)deletes.push('autosave');
          let entry;
          if(item){
            entry={id:trashId,originalId:workId,deletedAt,restoreAsCopy,reason:discard?'discard':'delete',item};
            puts.push(['trash:'+trashId,entry],['trash-index',[{id:trashId,name:item.name,deletedAt,restoreAsCopy},...(values['trash-index']||[])]]);
            if(packed?.font)puts.push(packed.font);
          }
          puts.push(['works-index',index],['work-states',states]);
          return {puts,deletes,value:{trashId:entry?trashId:null,workId,generation,active,keptSavedVersion:!!checkpoint}};
        });
        generations.set(workId,result.generation);if(result.trashId)lastTrashId=result.trashId;return result;
      }).catch(error=>{blocked.delete(workId);throw error;});
    }
    async function restore(trashId){
      return enqueue(async()=>{
        await ready;
        const entry=await E.dbGet('trash:'+trashId);if(!entry)throw Error('该作品已经恢复');
        const originalId=entry.originalId,copyId=id();
        serials.set(originalId,serial(originalId)+1);
        const result=await atomic(['trash:'+trashId,'trash-index','work:'+originalId,'works-index','work-states'],values=>{
          const current=values['trash:'+trashId];if(!current)throw Error('该作品已经恢复');
          const states=clone(values['work-states']||{}),asCopy=current.restoreAsCopy||!!values['work:'+originalId],workId=asCopy?copyId:originalId;
          const item=clone(current.item),generation=(states[workId]?.generation||0)+1;
          item.id=workId;item.document.workId=workId;
          if(asCopy){item.name=(item.name||'未命名作品')+' · 恢复副本';item.document.name=item.name;}
          item.revisions=(item.revisions||[]).map(version=>({...version,document:{...version.document,workId}}));
          item.updatedAt=new Date().toISOString();
          states[workId]={generation,deleted:false};
          const index=[metadata(item),...(values['works-index']||[]).filter(meta=>meta.id!==workId)];
          return {puts:[['work:'+workId,item],['works-index',index],['work-states',states],['trash-index',(values['trash-index']||[]).filter(meta=>meta.id!==trashId)]],deletes:['trash:'+trashId],value:{item,generation}};
        });
        generations.set(result.item.id,result.generation);blocked.delete(result.item.id);
        if(lastTrashId===trashId)lastTrashId=null;return {...result.item,document:await expand(result.item.document)};
      });
    }
    async function loadAutosave(){
      await ready;await queue;
      const [doc,states]=await Promise.all([E.dbGet('autosave'),E.dbGet('work-states')]);
      return doc&&!states?.[doc.workId]?.deleted?doc:null;
    }
    return {ready,save,expand,activate,loadAutosave,remove:workId=>moveToTrash(workId),discard:()=>moveToTrash(E.getProject().workId,{discard:true}),restore,flush:()=>queue,lastDeleted:()=>lastTrashId,isPristine};
  }
  if(typeof module!=='undefined')module.exports={createStore,isPristine};
  if(typeof document==='undefined')return;
  const E=ZTH_EDITOR,$=id=>document.getElementById(id),store=createStore(E),dialog=$('worksDialog'),list=$('worksList');
  let view='active';
  const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>Promise.resolve().then(fn).catch(e=>E.toast('操作失败：'+e.message));return b;};
  async function beforeSwitch(){
    const doc=clone(E.getProject());if(isPristine(doc)&&!await E.dbGet('work:'+doc.workId)){E.cancelAutosave?.();return true;}
    const prompt=$('replaceDialog');prompt.returnValue='cancel';
    const choice=await new Promise(resolve=>{prompt.addEventListener('close',()=>resolve(prompt.returnValue||'cancel'),{once:true});prompt.showModal();});
    if(choice==='cancel'||!['save','discard'].includes(choice))return false;
    E.cancelAutosave?.();
    if(choice==='save'){const result=await store.save(true);if(result.skipped)throw Error('作品状态已变化，请重新打开作品后再保存');}
    else await store.discard();
    return true;
  }
  async function openDocument(doc){
    const current=E.getProject();let conflict=false;
    if(!isPristine(current)||await E.dbGet('work:'+current.workId)){const saved=await store.save(true);if(saved.skipped){await store.save(true,{asCopy:true});conflict=true;}}
    E.cancelAutosave?.();await E.loadProject(await store.expand(doc));await store.activate(E.getProject().workId);const saved=await store.save();
    if(saved.skipped)throw Error('作品在其他窗口中已变化，请重新打开；当前画面可先导出备份');
    dialog.close();document.body.classList.remove('show-library','show-properties');E.toast(conflict?'作品已恢复，其他窗口冲突的改动已另存为副本':'作品已恢复，之前的状态已留在历史中');
  }
  async function removeWork(workId){
    const result=await store.remove(workId);
    if(result.active)await E.newBlank(true);
    await render();E.toast('作品已移到回收站，可撤销或恢复');
  }
  async function undoDelete(){const key=store.lastDeleted();if(!key)return E.toast('没有可撤销的删除');const item=await store.restore(key);await openDocument(item.document);}
  const actions=document.createElement('div');actions.className='row works-view-actions';actions.id='worksViewActions';
  const activeButton=button('我的作品',()=>render('active')),trashButton=button('回收站',()=>render('trash')),undoButton=button('撤销删除',undoDelete);
  activeButton.id='showActiveWorks';trashButton.id='showWorkTrash';undoButton.id='undoWorkDelete';actions.append(activeButton,trashButton,undoButton);
  if(dialog.insertBefore)dialog.insertBefore(actions,list);else dialog.append(actions);
  async function render(mode=view){
    view=mode;await store.flush();undoButton.disabled=!store.lastDeleted();
    const index=await E.dbGet(view==='trash'?'trash-index':'works-index')||[];list.replaceChildren();
    if(!index.length){const p=document.createElement('p');p.textContent=view==='trash'?'回收站是空的。删除的作品可以在这里恢复。':'还没有保存的作品。从空白画布开始，或选择模板创建副本。';list.append(p);return;}
    for(const meta of index){
      const card=document.createElement('article');card.className='work-card';const body=document.createElement('div'),name=document.createElement('h3'),time=document.createElement('p'),row=document.createElement('div');row.className='row';name.textContent=meta.name||'未命名作品';time.textContent=new Date(meta.updatedAt||meta.deletedAt).toLocaleString();
      if(view==='trash'){
        row.append(button(meta.restoreAsCopy?'恢复为新副本':'恢复作品',async()=>{await store.restore(meta.id);await render('trash');E.toast('作品已恢复到“我的作品”');}));
        if(meta.restoreAsCopy){const note=document.createElement('p');note.textContent='已保存的版本仍在作品库；这里保留的是丢弃的改动。';body.append(note);}
      }else{
        const image=document.createElement('img');image.src=meta.thumb;image.alt=meta.name;card.append(image);
        row.append(button('继续编辑',async()=>{const item=await E.dbGet('work:'+meta.id);if(!item)throw Error('作品已移入回收站');await openDocument(item.document);}),button('版本记录',()=>versions(meta.id)),button('导出工程',async()=>{const item=await E.dbGet('work:'+meta.id),doc=await store.expand(item.document);await E.download(new Blob([JSON.stringify(doc)],{type:'application/json'}),(meta.name||'ZTH-design').replace(/[\\/:*?"<>|]/g,'-')+'.zthpmsj');}),button('移到回收站',()=>removeWork(meta.id)));
      }
      body.append(name,time,row);card.append(body);list.append(card);
    }
  }
  async function versions(workId){
    const item=await E.dbGet('work:'+workId);if(!item)throw Error('作品已移入回收站');
    list.replaceChildren(button('← 返回我的作品',()=>render('active')));const title=document.createElement('h3');title.textContent=item.name+' · 最近 10 个保存版本';list.append(title);
    if(!item.revisions.length){const p=document.createElement('p');p.textContent='尚无手动保存版本，当前草稿仍在自动保存。';list.append(p);}
    item.revisions.forEach((version,i)=>{const row=document.createElement('article');row.className='work-card';const image=document.createElement('img');image.src=version.thumb;image.alt='历史版本 '+(i+1);row.append(image,button(new Date(version.at).toLocaleString()+' · 恢复此版本',()=>openDocument(version.document)));list.append(row);});
  }
  $('worksBtn').onclick=async()=>{$('workName').value=$('projectName').value;dialog.showModal();try{await store.save();await render('active');}catch(e){E.toast('作品历史读取失败，请导出工程备份：'+e.message);}};
  $('saveLocalWork').onclick=async()=>{try{$('projectName').value=$('workName').value.trim()||'未命名作品';E.changed();const result=await store.save(true);if(result.skipped)throw Error('作品已切换，请重新打开后保存');await render('active');E.toast('作品及版本已保存到此设备');}catch(e){E.toast('本地保存失败，请导出工程备份：'+e.message);}};
  $('workName').onchange=()=>{$('projectName').value=$('workName').value.trim()||'未命名作品';E.changed();};
  dialog.addEventListener('close',()=>list.replaceChildren());
  root.ZTH_WORKS={...store,beforeSwitch,openDocument,render,removeWork,undoDelete};
})(typeof window==='undefined'?globalThis:window);
