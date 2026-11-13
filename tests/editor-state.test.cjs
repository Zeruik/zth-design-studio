'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const fabric=require('fabric');
const {webcrypto}=require('node:crypto');
const {createStore,isPristine}=require('../app/works.js');

function object(type='rect',properties={}) {
  return {
    type,locked:false,editable:true,isEditing:false,
    set(key,value) {if(typeof key==='string')this[key]=value;else Object.assign(this,key);return this;},
    exitEditing() {this.isEditing=false;},...properties
  };
}

function fixture() {
  const elements=new Map();let nextId=0,loadError;
  const element=id=>{
    if(!elements.has(id))elements.set(id,{
      value:'',clientWidth:1200,clientHeight:900,parentElement:{},
      listeners:{},classList:{add() {},remove() {},toggle() {}},append() {},replaceChildren() {},
      addEventListener(type,listener) {(this.listeners[type]||=[]).push(listener);},
      dispatch(type,event={}) {for(const listener of this.listeners[type]||[])listener(event);}
    });
    return elements.get(id);
  };
  class Canvas {
    constructor() {this.objects=[];this.active=null;this.backgroundColor='#fff';}
    on() {}
    getObjects() {return this.objects;}
    getActiveObject() {return this.active;}
    getActiveObjects() {return this.active?.getObjects?.()||[this.active].filter(Boolean);}
    discardActiveObject() {this.active=null;}
    setActiveObject(o) {this.active=o;}
    requestRenderAll() {}
    setDimensions() {}
    setZoom() {}
    async loadFromJSON(data) {if(loadError)throw loadError;this.objects=data.objects||[];this.backgroundColor=data.background;}
    toObject() {return {objects:this.objects,background:this.backgroundColor};}
  }
  class ActiveSelection {
    constructor(objects) {this.type='activeselection';this.objects=objects;}
    getObjects() {return this.objects;}
  }
  // Use actual Fabric geometry/color/default APIs. Only the interactive canvas
  // is mocked so these state checks do not require a browser or native canvas.
  // Isolate the compatibility wrapper from other fixture instances.
  class FixtureGradient extends fabric.Gradient {}
  const context=vm.createContext({
    document:{body:element('body'),getElementById:element,querySelectorAll:()=>[],addEventListener() {},createElement:()=>element('generated-'+nextId++),fonts:{add() {}}},
    fabric:{...fabric,Canvas,ActiveSelection,Gradient:FixtureGradient},
    window:{},crypto:{randomUUID:()=>`id-${++nextId}`},
    indexedDB:{open:()=>({})},ResizeObserver:class {observe() {}},
    clearTimeout() {},setTimeout:()=>1,
    ZTH_ALGORITHMS:{validateProject:doc=>doc}
  });
  const source=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
  // Exercise the real editor handlers without starting font/network/DB boot.
  const withoutBoot=source.replace(/^init\(\)\.then\([^\n]+\);\s*$/m,'');
  assert.notEqual(withoutBoot,source,'the boot call must be removed for this isolated harness');
  vm.runInContext(withoutBoot,context,{filename:'app.js'});
  const canvas=vm.runInContext('canvas',context);
  return {
    context,canvas,elements,editor:context.window.ZTH_EDITOR,
    run:script=>vm.runInContext(script,context),
    failLoad:error=>{loadError=error;}
  };
}

test('locking a text object exits text editing and blocks both drag transforms and editing',()=>{
  const f=fixture();const text=object('textbox',{isEditing:true});f.context.subject=text;
  f.run('setLocked(subject,true)');
  assert.equal(text.locked,true);assert.equal(text.isEditing,false);assert.equal(text.editable,false);
  for(const key of ['lockMovementX','lockMovementY','lockScalingX','lockScalingY','lockRotation'])assert.equal(text[key],true,key);
  assert.equal(f.editor.canEdit(text),false);
  f.run('setLocked(subject,false)');assert.equal(text.editable,true);assert.equal(f.editor.canEdit(text),true);
});

test('multi-selection cannot transform locked members and locking a selection persists on its objects',()=>{
  const f=fixture();const fixed=object('image',{locked:true}),editable=object();
  f.context.members=[fixed,editable];f.canvas.objects=f.context.members;
  f.run('canvas.setActiveObject(new F.ActiveSelection(members,{canvas}))');
  assert.equal(f.editor.canEdit(f.canvas.active),false);
  f.run('protectSelection()');assert.equal(f.canvas.active,editable);assert.equal(fixed.locked,true);
  const another=object('textbox');f.context.members=[editable,another];f.canvas.objects=f.context.members;
  f.run('canvas.setActiveObject(new F.ActiveSelection(members,{canvas}));lock(canvas.getActiveObject())');
  assert.equal(editable.locked,true);assert.equal(another.locked,true);assert.equal(another.editable,false);
  assert.equal(f.canvas.active,null);
});

test('a failed project load preserves the current pages, identity and undo state and clears the busy flag',async()=>{
  const f=fixture();
  f.run("pages=[{width:1080,height:1440,canvas:{objects:[]}}];workId='current-work';history=['current-history'];historyIndex=0");
  const currentPages=f.run('pages');f.elements.get('projectName').value='Current artwork';
  f.failLoad(Error('Invalid image data'));
  await assert.rejects(f.editor.loadProject({format:'zthpmsj',schema:1,workId:'bad-import',name:'Broken import',pages:[{width:100,height:100,canvas:{objects:[]}}]}),/Invalid image data/);
  assert.equal(f.run('pages'),currentPages);assert.equal(f.run('workId'),'current-work');
  assert.equal(f.run('history[0]'),'current-history');assert.equal(f.run('historyIndex'),0);
  assert.equal(f.elements.get('projectName').value,'Current artwork');assert.equal(f.run('busy'),false);
});

test('a malformed saved template does not adopt a new work identity before it loads',async()=>{
  const f=fixture();f.run("workId='current-work'");f.failLoad(Error('Malformed template'));
  await assert.rejects(f.editor.applyTemplate({name:'Broken',document:{format:'zthpmsj',schema:1,pages:[{width:100,height:100,canvas:{objects:[]}}]}},true),/Malformed template/);
  assert.equal(f.run('workId'),'current-work');assert.equal(f.run('busy'),false);
});

test('image and template property tools cannot modify a locked logo',async()=>{
  const f=fixture();const logo=object('image',{locked:true,role:'logo',flipX:false,flipY:false,imageSlot:false,keepRatio:true,getElement(){throw Error('Locked image must not open an editor');}});
  f.canvas.active=logo;f.canvas.objects=[logo];f.context.ZTH_EDITOR=f.editor;
  for(const file of ['image-tools.js','template-tools.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../app',file),'utf8'),f.context,{filename:file});
  for(const id of ['flipHBtn','flipVBtn','cropBtn','bgRemoveBtn','replaceImageBtn'])f.elements.get(id).onclick();
  f.elements.get('imageSlot').checked=true;f.elements.get('imageSlot').onchange();
  f.elements.get('keepRatio').checked=false;f.elements.get('keepRatio').onchange();
  f.elements.get('roleSelect').value='photo';f.elements.get('roleSelect').onchange();
  assert.equal(logo.flipX,false);assert.equal(logo.flipY,false);assert.equal(logo.role,'logo');
  assert.equal(logo.imageSlot,false);assert.equal(logo.keepRatio,true);
  assert.equal(f.elements.get('imageSlot').checked,false);assert.equal(f.elements.get('keepRatio').checked,true);
});

test('Fabric 7 keeps legacy template coordinates at the top left while honoring explicit origins',async()=>{
  const f=fixture();
  const rect=await f.editor.sceneObject({kind:'rect',left:80,top:120,width:200,height:60,strokeWidth:0,fill:'#123456'});
  assert.equal(rect.originX,'left');assert.equal(rect.originY,'top');
  assert.deepEqual(rect.getBoundingRect(),{left:80,top:120,width:200,height:60});
  const centered=await f.editor.sceneObject({kind:'rect',left:80,top:120,width:40,height:20,strokeWidth:0,originX:'center',originY:'center'});
  assert.deepEqual(centered.getBoundingRect(),{left:60,top:110,width:40,height:20});
});

test('legacy gradient stop opacity survives Fabric 7 rendering and subsequent serialization',async()=>{
  const f=fixture();
  const source={type:'linear',gradientUnits:'pixels',coords:{x1:0,y1:0,x2:300,y2:0},colorStops:[
    {offset:0,color:'#ff0000',opacity:0},
    {offset:.25,color:'#336699',opacity:.25},
    {offset:.75,color:'rgb(10,20,30)',opacity:1},
    {offset:1,color:'rgba(0,255,0,0.4)'}
  ]};
  const original=structuredClone(source);
  const gradient=await f.context.fabric.Gradient.fromObject(source);
  const actualStops=[];
  gradient.toLive({createLinearGradient:(...coords)=>{
    assert.deepEqual(coords,[0,0,300,0]);
    return {addColorStop:(offset,color)=>actualStops.push({offset,color})};
  }});
  assert.deepEqual(actualStops.map(stop=>new fabric.Color(stop.color).getAlpha()),[0,.25,1,.4]);
  assert.deepEqual(actualStops.map(stop=>stop.offset),[0,.25,.75,1]);
  assert.deepEqual(source,original,'migration must not mutate the saved project');
  const reopened=await f.context.fabric.Gradient.fromObject(gradient.toObject());
  assert.deepEqual(reopened.colorStops.map(stop=>new fabric.Color(stop.color).getAlpha()),[0,.25,1,.4]);
});

const copy=value=>value===undefined?undefined:structuredClone(value);
const draft=(name='未命名作品',workId='draft-a')=>({format:'zthpmsj',schema:1,appVersion:'3.0.0',workId,name,fonts:[],activePage:0,savedAt:'2026-11-13T12:00:00.000Z',pages:[{width:1080,height:1440,canvas:{background:'#ffffff',objects:[]}}]});

// This adapter models one serial IndexedDB readwrite transaction, including a
// commit pause after its callback has run. Writes are applied all-or-nothing.
function persistence(initial=draft(),shared){
  const backend=shared||{data:new Map(),tail:Promise.resolve(),gate:null,fail:false};
  let current=copy(initial);
  const E={
    getProject:()=>copy(current),cancelAutosave() {},
    canvas:{getWidth:()=>1080,toDataURL:()=> 'data:image/png;base64,thumbnail'},
    dbGet:async key=>copy(backend.data.get(key)),
    dbPut:async(key,value)=>backend.data.set(key,copy(value)),
    dbAtomic(keys,update){
      const task=backend.tail.then(async()=>{
        const values=Object.fromEntries(keys.map(key=>[key,copy(backend.data.get(key))]));
        const plan=update(values)||{};
        if(backend.gate?.matches(plan)){
          const gate=backend.gate;backend.gate=null;gate.enter(plan);await gate.wait;
        }
        if(backend.fail){backend.fail=false;throw Error('Atomic storage failure');}
        const next=new Map(backend.data);
        for(const [key,value] of plan.puts||[])next.set(key,copy(value));
        for(const key of plan.deletes||[])next.delete(key);
        backend.data=next;return copy(plan.value);
      });
      backend.tail=task.catch(()=>{});return task;
    },
    loadProject:async doc=>{current=copy(doc);},
    changed() {},toast() {},download() {},
  };
  const store=createStore(E);
  return {
    E,store,backend,set:doc=>{current=copy(doc);},get:()=>copy(current),read:key=>copy(backend.data.get(key)),
    pause(key){
      let enter,release;const entered=new Promise(resolve=>{enter=resolve;}),wait=new Promise(resolve=>{release=resolve;});
      backend.gate={matches:plan=>(plan.puts||[]).some(([name])=>name===key),enter,wait};
      return {entered,release};
    }
  };
}

function worksUI(f){
  const elements=new Map();let shown;
  function el(id){
    if(!elements.has(id))elements.set(id,{
      value:'',children:[],listeners:{},classList:{remove() {}},
      append(...children){this.children.push(...children);},insertBefore(child){this.children.unshift(child);},
      replaceChildren(...children){this.children=children;},
      addEventListener(type,fn,options){(this.listeners[type]||=[]).push({fn,once:options?.once});},
      showModal(){shown?.();},
      close(value){if(value!==undefined)this.returnValue=value;const listeners=this.listeners.close||[];this.listeners.close=listeners.filter(item=>!item.once);for(const item of listeners)item.fn();}
    });
    return elements.get(id);
  }
  let generated=0;
  const context=vm.createContext({ZTH_EDITOR:f.E,window:{},crypto:webcrypto,TextEncoder,console,Blob,
    document:{body:el('body'),getElementById:el,createElement:()=>el('generated-'+generated++)}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../app/works.js'),'utf8'),context,{filename:'works.js'});
  const api=context.window.ZTH_WORKS;
  return {api,elements,async choose(choice){const visible=new Promise(resolve=>{shown=resolve;});const pending=api.beforeSwitch();await visible;el('replaceDialog').close(choice);return pending;}};
}

test('new blank drafts are persisted for reload without polluting My works until explicitly saved',async()=>{
  const f=persistence();await f.store.ready;await f.store.save();
  assert.equal(isPristine(f.get()),true);assert.equal(f.read('work:draft-a'),undefined);
  assert.deepEqual(f.read('works-index')||[],[]);assert.deepEqual(await f.store.loadAutosave(),f.get());
  await f.store.save(true);
  assert.equal(f.read('works-index').length,1);assert.equal(f.read('work:draft-a').revisions.length,1);
  const changed=draft('未命名作品');changed.pages[0].canvas.objects=[{type:'rect',fill:'#ff0000'}];f.set(changed);await f.store.save();
  f.set(draft());await f.store.save();
  assert.deepEqual(f.read('work:draft-a').document.pages[0].canvas.objects,[],'clearing an existing work must replace its autosaved content');
});

test('delete invalidates queued and in-flight autosaves, and undo restores the last visible draft',async()=>{
  const f=persistence(draft('作品 A'));await f.store.ready;await f.store.save(true);
  const edited=f.get();edited.name='删除前最新改动';f.set(edited);
  const gate=f.pause('work:draft-a'),inFlight=f.store.save();await gate.entered;
  const queued=f.store.save(),deleted=f.store.remove('draft-a');gate.release();
  await inFlight;assert.equal((await queued).skipped,true);const result=await deleted;
  assert.equal(f.read('work:draft-a'),undefined);assert.equal(f.read('autosave'),undefined);assert.deepEqual(f.read('works-index'),[]);
  assert.equal(f.read('work-states')['draft-a'].deleted,true);
  assert.equal(f.read('trash:'+result.trashId).item.document.name,edited.name);
  assert.equal((await f.store.save()).skipped,true,'a stale caller must not resurrect a deleted work');
  const restored=await f.store.restore(result.trashId);assert.equal(restored.id,'draft-a');assert.equal(restored.document.name,edited.name);
  f.set(restored.document);await f.store.activate(restored.id);await f.store.save();
  assert.equal((await f.store.loadAutosave()).name,edited.name);assert.deepEqual(f.read('trash-index'),[]);
});

test('discard retains the last manual version and recovers unsaved changes as an independent copy',async()=>{
  const f=persistence(draft('手动保存版'));await f.store.ready;await f.store.save(true);
  const edited=f.get();edited.name='尚未保存的修改';edited.pages[0].canvas.objects=[{type:'rect',fill:'#123456'}];f.set(edited);await f.store.save();
  const result=await f.store.discard();
  assert.equal(result.keptSavedVersion,true);assert.equal(f.read('work:draft-a').document.name,'手动保存版');
  assert.equal(f.read('works-index')[0].name,'手动保存版');assert.equal(f.read('autosave'),undefined);
  const recovered=await f.store.restore(result.trashId);
  assert.notEqual(recovered.id,'draft-a');assert.equal(recovered.document.workId,recovered.id);
  assert.match(recovered.name,/尚未保存的修改.*恢复副本/);assert.equal(recovered.document.pages[0].canvas.objects[0].fill,'#123456');
  assert.equal(f.read('work:draft-a').document.name,'手动保存版');assert.equal(f.read('works-index').length,2);
});

test('discarding an unsaved draft moves the entire work to trash and tombstones reject stale reload data',async()=>{
  const f=persistence(draft('从模板创建的副本'));await f.store.ready;await f.store.save();
  const old=f.get(),result=await f.store.discard();assert.equal(result.keptSavedVersion,false);
  assert.equal(f.read('work:draft-a'),undefined);assert.deepEqual(f.read('works-index'),[]);
  f.backend.data.set('autosave',old);
  const reload=persistence(old,f.backend);await reload.store.ready;
  assert.equal(await reload.store.loadAutosave(),null);assert.equal((await reload.store.save()).skipped,true);
});

test('the template switch dialog saves, discards, or cancels without silently saving a cancel',async()=>{
  for(const choice of ['cancel','save','discard']){
    const f=persistence(draft('待选择的作品')),ui=worksUI(f);await ui.api.ready;await ui.api.save();
    const before=copy([...f.backend.data]),accepted=await ui.choose(choice);
    assert.equal(accepted,choice!=='cancel');
    if(choice==='cancel')assert.deepEqual([...f.backend.data],before);
    if(choice==='save')assert.equal(f.read('work:draft-a').revisions.length,1);
    if(choice==='discard'){assert.equal(f.read('work:draft-a'),undefined);assert.equal(f.read('trash-index').length,1);}
  }
  const blank=persistence(),ui=worksUI(blank);await ui.api.ready;assert.equal(await ui.api.beforeSwitch(),true);
  await ui.api.save(true);assert.equal(await ui.choose('cancel'),false,'an explicitly saved empty work still needs a choice');
});

test('font cache keys include every font and preserve older multi-font revisions',async()=>{
  const f=persistence(draft('多字体作品'));await f.store.ready;
  const first=f.get();first.fonts=[{family:'ZTH Sans',src:'data:first'},{family:'Roboto Mono',src:'data:mono-a'}];f.set(first);await f.store.save(true);
  const second=copy(first);second.fonts[1].src='data:mono-b';f.set(second);await f.store.save(true);
  const revisions=f.read('work:draft-a').revisions;
  assert.notEqual(revisions[0].document.fontKey,revisions[1].document.fontKey);
  assert.deepEqual((await f.store.expand(revisions[1].document)).fonts,first.fonts);
  assert.deepEqual((await f.store.expand(revisions[0].document)).fonts,second.fonts);
});

test('failed atomic saves leave no partial document, history, font, index, or autosave records',async()=>{
  const doc=draft('原子保存');doc.fonts=[{family:'ZTH Sans',src:'data:font'}];
  const f=persistence(doc);await f.store.ready;f.backend.fail=true;
  await assert.rejects(f.store.save(true),/Atomic storage failure/);assert.equal(f.backend.data.size,0);
  await f.store.save(true);assert.equal(f.read('work:draft-a').revisions.length,1);
  assert.deepEqual(await f.store.loadAutosave(),doc);
});

test('two windows cannot overwrite a newer saved revision, and explicitly reopening recognizes its generation',async()=>{
  const a=persistence(draft('窗口 A')),b=persistence(draft('窗口 B'),a.backend);await Promise.all([a.store.ready,b.store.ready]);
  await a.store.save(true);assert.equal((await b.store.save()).skipped,true);assert.equal(a.read('work:draft-a').name,'窗口 A');
  const deleted=await a.store.remove('draft-a');const restored=await a.store.restore(deleted.trashId);
  b.set(restored.document);await b.store.activate(restored.id);const updated=b.get();updated.name='重新打开后的编辑';b.set(updated);
  assert.notEqual((await b.store.save()).skipped,true);assert.equal(a.read('work:draft-a').name,updated.name);
  assert.equal((await a.store.save()).skipped,true,'the other window remains stale after a newer save');
});

test('new blank and template-copy transitions keep the original template immutable',async()=>{
  const f=fixture();await f.editor.newBlank(true);
  const empty=f.editor.getProject();assert.equal(empty.appVersion,'3.0.0');assert.equal(empty.name,'未命名作品');assert.equal(empty.pages.length,1);assert.equal(empty.pages[0].canvas.objects.length,0);assert.equal(empty.pages[0].canvas.background,'#ffffff');
  const template={name:'只读模板',document:draft('原始名称','original-template')},original=copy(template);
  f.context.ZTH_WORKS=f.context.window.ZTH_WORKS={beforeSwitch:async()=>false};
  assert.equal(await f.editor.applyTemplate(template),false);assert.equal(f.editor.getProject().workId,empty.workId);
  f.context.ZTH_WORKS=f.context.window.ZTH_WORKS={beforeSwitch:async()=>true,activate:async()=>{},save:async()=>({})};
  assert.equal(await f.editor.applyTemplate(template),true);
  assert.notEqual(f.editor.getProject().workId,original.document.workId);assert.equal(f.editor.getProject().name,'只读模板 · 副本');
  f.canvas.objects.push({type:'rect'});assert.deepEqual(template,original);
});

test('text input updates immediately, respects IME composition and caret, and numeric Enter commits',()=>{
  const f=fixture(),text=object('textbox',{text:'原文字',fontSize:48,opacity:1,getScaledWidth:()=>200,getScaledHeight:()=>80,setCoords() {}});
  f.canvas.active=text;f.canvas.objects=[text];const input=f.elements.get('textValue');
  f.context.document.activeElement=input;input.value='输入中的文字';input.selectionStart=3;input.selectionEnd=3;
  input.oninput({isComposing:false});assert.equal(text.text,'输入中的文字');assert.equal(input.selectionStart,3);assert.equal(input.value,'输入中的文字');
  input.oncompositionstart();input.value='尚在拼音候选';input.oninput({isComposing:true});assert.equal(text.text,'输入中的文字');
  input.value='中文输入完成';input.oncompositionend();assert.equal(text.text,'中文输入完成');
  const pos=f.elements.get('posY');pos.value='321';let prevented=false;pos.dispatch('keydown',{key:'Enter',preventDefault(){prevented=true;}});
  assert.equal(text.top,321);assert.equal(prevented,true);
});
