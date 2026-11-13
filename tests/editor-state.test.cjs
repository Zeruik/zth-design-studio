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

function fixture({realObjects=false,realCanvas=false}={}) {
  if(realCanvas)realObjects=true;
  const runtime=realObjects?require('fabric/node'):fabric;
  const elements=new Map();let nextId=0,loadError,loadGate;
  const element=id=>{
    if(!elements.has(id))elements.set(id,{
      value:'',clientWidth:1200,clientHeight:900,parentElement:{},
      listeners:{},children:[],classList:{add() {},remove() {},toggle() {}},append(...children) {this.children.push(...children);},replaceChildren(...children) {this.children=children;},remove() {this.removed=true;},
      addEventListener(type,listener) {(this.listeners[type]||=[]).push(listener);},
      dispatch(type,event={}) {for(const listener of this.listeners[type]||[])listener(event);}
    });
    return elements.get(id);
  };
  class Canvas {
    constructor() {this.objects=[];this.active=null;this.backgroundColor='#fff';this.listeners={};this.renderOnAddRemove=true;}
    on(type,listener) {(this.listeners[type]||=[]).push(listener);}
    fire(type,event={}) {for(const listener of this.listeners[type]||[])listener(event);}
    getObjects() {return this.objects;}
    getActiveObject() {return this.active;}
    getActiveObjects() {return this.active?.type==='activeselection'?this.active.getObjects():[this.active].filter(Boolean);}
    discardActiveObject() {this.active=null;}
    setActiveObject(o) {this.active=o;}
    requestRenderAll() {}
    add(...objects) {this.objects.push(...objects);}
    insertAt(index,...objects) {this.objects.splice(index,0,...objects);}
    remove(...objects) {this.objects=this.objects.filter(o=>!objects.includes(o));}
    bringObjectForward(o) {const i=this.objects.indexOf(o);if(i>=0&&i<this.objects.length-1)[this.objects[i],this.objects[i+1]]=[this.objects[i+1],this.objects[i]];}
    sendObjectBackwards(o) {const i=this.objects.indexOf(o);if(i>0)[this.objects[i],this.objects[i-1]]=[this.objects[i-1],this.objects[i]];}
    setDimensions() {}
    setZoom() {}
    async loadFromJSON(data) {
      this.renderOnAddRemove=false;
      if(loadGate){const gate=loadGate;loadGate=null;gate.enter();await gate.wait;}
      if(loadError)throw loadError;
      this.objects=realObjects?await runtime.util.enlivenObjects(data.objects||[]):data.objects||[];this.backgroundColor=data.background;this.renderOnAddRemove=true;
    }
    toObject() {return {objects:this.objects.map(o=>o.toObject?.()||o),background:this.backgroundColor?.toObject?.()||this.backgroundColor};}
  }
  class ActiveSelection {
    constructor(objects) {this.type='activeselection';this.objects=objects;}
    getObjects() {return this.objects;}
  }
  class RealCanvas extends runtime.Canvas {
    constructor(_element,options){super(undefined,{...options,renderOnAddRemove:false});}
    requestRenderAll() {return this;}
  }
  // Use actual Fabric geometry/color/default APIs. Only the interactive canvas
  // is mocked so these state checks do not require a browser or native canvas.
  // Isolate the compatibility wrapper from other fixture instances.
  class FixtureGradient extends runtime.Gradient {}
  const documentListeners={};
  const context=vm.createContext({
    document:{body:element('body'),getElementById:element,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(type,listener) {(documentListeners[type]||=[]).push(listener);},createElement:()=>element('generated-'+nextId++),fonts:{add() {}}},
    fabric:{...runtime,Canvas:realCanvas?RealCanvas:Canvas,ActiveSelection:realCanvas?runtime.ActiveSelection:ActiveSelection,Gradient:FixtureGradient},
    console,Blob,
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
    context,canvas,elements,editor:context.window.ZTH_EDITOR,runtime,
    run:script=>vm.runInContext(script,context),
    failLoad:error=>{loadError=error;},
    dispatch:(type,event)=>{for(const listener of documentListeners[type]||[])listener(event);},
    pauseLoad(){let enter,release;const entered=new Promise(resolve=>{enter=resolve;}),wait=new Promise(resolve=>{release=resolve;});loadGate={enter,wait};return {entered,release};}
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
  const empty=f.editor.getProject();assert.equal(empty.appVersion,'4.0.0');assert.equal(empty.name,'未命名作品');assert.equal(empty.pages.length,1);assert.equal(empty.pages[0].canvas.objects.length,0);assert.equal(empty.pages[0].canvas.background,'#ffffff');
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

test('rapid undo/redo requests serialize and block edits until the final requested state is visible',async()=>{
  const f=fixture();await f.editor.newBlank(true);
  for(const color of ['#ff0000','#0000ff','#00ff00'])f.editor.setBackground(color);
  const gate=f.pauseLoad(),first=f.editor.undo();await gate.entered;
  assert.equal(f.editor.isBusy(),true);assert.equal(f.editor.setBackground('#abcdef'),false);
  const rest=[f.editor.undo(),f.editor.undo(),f.editor.redo()];gate.release();await Promise.all([first,...rest]);
  assert.equal(f.canvas.backgroundColor,'#ff0000');assert.equal(f.editor.getHistory().index,1);
  assert.equal(f.editor.isBusy(),false);assert.equal(f.canvas.selection,true);assert.equal(f.canvas.skipTargetFind,false);
});

test('failed history hydration retains the timeline cursor and allows the next undo to succeed',async()=>{
  const f=fixture();await f.editor.newBlank(true);f.editor.setBackground('#123456');
  f.failLoad(Error('Image decode failed'));
  await assert.rejects(f.editor.undo(),/Image decode failed/);
  assert.equal(f.editor.getHistory().index,1);assert.equal(f.canvas.backgroundColor,'#123456');assert.equal(f.editor.isBusy(),false);
  assert.equal(f.canvas.renderOnAddRemove,true,'a failed Fabric load must not disable future automatic rendering');
  f.failLoad(null);assert.equal(await f.editor.undo(),true);assert.equal(f.canvas.backgroundColor,'#ffffff');
});

test('opening a document supersedes queued history restores without late old-canvas writes',async()=>{
  const f=fixture();await f.editor.newBlank(true);f.editor.setBackground('#123456');f.editor.setBackground('#654321');
  const gate=f.pauseLoad(),first=f.editor.undo();await gate.entered;const stale=f.editor.undo();
  const next=draft('新文档','next-document');next.pages[0].canvas.background='#eeeeee';const opening=f.editor.loadProject(next);
  gate.release();await first;assert.equal(await stale,false);await opening;
  assert.equal(f.editor.getProject().workId,'next-document');assert.equal(f.canvas.backgroundColor,'#eeeeee');
  assert.equal(f.editor.getHistory().entries.length,1);assert.equal(await f.editor.undo(),false);
});

test('page additions, edits, deletion and restore share one history while navigation preserves it',async()=>{
  const f=fixture();await f.editor.newBlank(true);f.editor.setBackground('#112233');
  await f.editor.addPage({name:'横版',width:1920,height:1080,canvas:{objects:[],background:'#ffffff'}});
  f.editor.setBackground('#445566');const count=f.editor.getHistory().entries.length;
  await f.editor.switchPage(0);await f.editor.switchPage(1);assert.equal(f.editor.getHistory().entries.length,count);
  await f.editor.deletePage(0);assert.equal(f.editor.getProject().pages.length,1);assert.equal(f.canvas.backgroundColor,'#445566');
  await f.editor.undo();assert.equal(f.editor.getProject().pages.length,2);assert.equal(f.editor.getProject().pages[0].canvas.background,'#112233');
  await f.editor.undo();assert.equal(f.canvas.backgroundColor,'#ffffff');assert.equal(f.editor.getProject().activePage,1);
  await f.editor.undo();assert.equal(f.editor.getProject().pages.length,1);assert.equal(f.canvas.backgroundColor,'#112233');
  await f.editor.redo();assert.equal(f.editor.getProject().pages.length,2);assert.equal(f.editor.getSize().width,1920);
});

test('real Fabric add, duplicate, color, order, lock and delete actions round-trip through undo/redo',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const first=new f.runtime.Rect({left:20,top:40,width:120,height:80,fill:'#ff0000',name:'A'});f.editor.add(first);
  const second=new f.runtime.Rect({left:200,top:40,width:80,height:60,fill:'#0000ff',name:'B'});f.editor.add(second);
  await f.editor.duplicate();assert.equal(f.canvas.getObjects().length,3);assert.equal(f.canvas.getObjects()[2].left,230);
  await f.editor.undo();assert.equal(f.canvas.getObjects().length,2);await f.editor.redo();assert.equal(f.canvas.getObjects().length,3);
  f.canvas.setActiveObject(f.canvas.getObjects()[0]);f.editor.changeObject(o=>o.set('fill','#00ff00'),'修改颜色');
  await f.editor.undo();assert.equal(f.canvas.getObjects()[0].fill,'#ff0000');await f.editor.redo();assert.equal(f.canvas.getObjects()[0].fill,'#00ff00');
  f.canvas.setActiveObject(f.canvas.getObjects()[0]);f.elements.get('forwardBtn').onclick();assert.equal(f.canvas.getObjects()[1].name,'A');
  await f.editor.undo();assert.equal(f.canvas.getObjects()[0].name,'A');await f.editor.redo();
  f.canvas.setActiveObject(f.canvas.getObjects()[1]);f.elements.get('lockBtn').onclick();assert.equal(f.canvas.getObjects()[1].locked,true);
  const count=f.editor.getHistory().entries.length;f.editor.remove();assert.equal(f.canvas.getObjects().length,3);assert.equal(f.editor.getHistory().entries.length,count);
  await f.editor.undo();assert.equal(f.canvas.getObjects()[1].locked,undefined);await f.editor.redo();assert.equal(f.canvas.getObjects()[1].locked,true);
  f.canvas.setActiveObject(f.canvas.getObjects()[1]);f.elements.get('lockBtn').onclick();f.editor.remove();assert.equal(f.canvas.getObjects().length,2);
  await f.editor.undo();assert.equal(f.canvas.getObjects().length,3);assert.equal(f.canvas.getObjects()[1].name,'A');
});

test('grouping and ungrouping preserve geometry and surrounding stacking order with real Fabric objects',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const shapes=['A','B','C','D'].map((name,i)=>new f.runtime.Rect({left:30+i*100,top:30+i*20,width:50,height:60,angle:i*15,name}));
  for(const shape of shapes)f.editor.add(shape);
  const bounds=shapes.map(shape=>shape.getBoundingRect());
  f.context.members=[shapes[0],shapes[2]];f.run('canvas.setActiveObject(new F.ActiveSelection(members,{canvas}))');f.editor.groupSelection();
  assert.deepEqual(f.canvas.getObjects().map(o=>o.name),['B','组合','D']);
  await f.editor.undo();assert.deepEqual(f.canvas.getObjects().map(o=>o.name),['A','B','C','D']);
  f.canvas.getObjects().forEach((shape,i)=>assert.deepEqual(shape.getBoundingRect(),bounds[i]));
  await f.editor.redo();f.canvas.setActiveObject(f.canvas.getObjects()[1]);f.editor.ungroupSelection();
  assert.deepEqual(f.canvas.getObjects().map(o=>o.name),['B','A','C','D']);
  for(const name of ['A','C']){
    const actual=f.canvas.getObjects().find(o=>o.name===name).getBoundingRect(),expected=bounds['ABCD'.indexOf(name)];
    for(const key of ['left','top','width','height'])assert.ok(Math.abs(actual[key]-expected[key])<.001,`${name} ${key}`);
  }
  await f.editor.undo();assert.equal(f.canvas.getObjects()[1].type,'group');await f.editor.redo();assert.equal(f.canvas.getObjects().length,4);
});

test('canvas resize and project/page names are undoable and scaling keeps locked descendants fixed',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const fixed=new f.runtime.Rect({left:100,top:80,width:50,height:70,locked:true}),moving=new f.runtime.Rect({left:200,top:160,width:50,height:70});
  f.editor.add(fixed);f.editor.add(moving);f.editor.resizeCanvas(540,720,{scaleContent:true});
  assert.equal(fixed.left,100);assert.equal(fixed.scaleX,1);assert.equal(moving.left,100);assert.equal(moving.scaleX,.5);
  await f.editor.undo();assert.equal(f.editor.getSize().width,1080);assert.equal(f.canvas.getObjects()[1].left,200);
  await f.editor.redo();assert.equal(f.editor.getSize().width,540);assert.equal(f.canvas.getObjects()[0].locked,true);
  f.elements.get('projectName').value='重命名的作品';f.elements.get('projectName').onchange();
  f.editor.renamePage(0,'封面');await f.editor.undo();assert.notEqual(f.editor.getPages()[0].name,'封面');
  await f.editor.undo();assert.equal(f.editor.getProject().name,'未命名作品');await f.editor.redo();assert.equal(f.editor.getProject().name,'重命名的作品');
});

test('text typing merges into one undo step, IME intermediate states are omitted and blur starts a new step',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const text=new f.runtime.Textbox('起点',{width:300,fontSize:24});f.editor.add(text);const input=f.elements.get('textValue');f.context.document.activeElement=input;
  for(const value of ['你','你好','你好世界']){input.value=value;input.oninput({isComposing:false});}
  assert.equal(f.editor.getHistory().entries.length,3);assert.equal(text.text,'你好世界');
  input.oncompositionstart();input.value='nihao';input.oninput({isComposing:true});assert.equal(f.editor.getHistory().entries.length,3);
  input.value='你好世界！';input.oncompositionend();assert.equal(f.editor.getHistory().entries.length,3);
  input.dispatch('blur');input.value='第二段';input.oninput({isComposing:false});assert.equal(f.editor.getHistory().entries.length,4);
  f.context.document.activeElement=null;await f.editor.undo();assert.equal(f.canvas.getObjects()[0].text,'你好世界！');
  await f.editor.undo();assert.equal(f.canvas.getObjects()[0].text,'起点');await f.editor.redo();assert.equal(f.canvas.getObjects()[0].text,'你好世界！');
});

test('history subscriptions are detached summaries, timeline jumps are stable, and new edits remove redo branches',async()=>{
  const f=fixture();await f.editor.newBlank(true);const events=[],unsubscribe=f.editor.subscribeHistory(state=>events.push(state));
  f.editor.setBackground('#111111');f.editor.setBackground('#222222');const summary=f.editor.getHistory(),first=summary.entries[1].id;
  summary.entries[1].label='external mutation';assert.notEqual(f.editor.getHistory().entries[1].label,'external mutation');
  assert.equal(await f.editor.goToHistory(first),true);assert.equal(f.canvas.backgroundColor,'#111111');assert.equal(f.editor.getHistory().canRedo,true);
  f.editor.setBackground('#333333');assert.equal(f.editor.getHistory().canRedo,false);assert.equal(await f.editor.goToHistory(summary.entries[2].id),false);
  assert.ok(events.some(state=>state.busy));assert.equal(events.at(-1).busy,false);const count=events.length;unsubscribe();f.editor.setBackground('#444444');assert.equal(events.length,count);
});

test('history shares image payloads, enforces count and memory limits, and releases abandoned assets',async()=>{
  const f=fixture();await f.editor.newBlank(true);const source='data:image/png;base64,'+'A'.repeat(1024*1024);
  f.canvas.objects=[{type:'image',src:source,left:0}];f.editor.changed('添加图片');
  for(let i=1;i<=70;i++){f.canvas.objects[0].left=i;f.editor.changed('移动图片');}
  assert.equal(f.editor.getHistory().entries.length,50);assert.ok(f.editor.getHistory().bytes<source.length*2+150000);
  await f.editor.undo();assert.equal(f.canvas.getObjects()[0].src,source);assert.equal(f.canvas.getObjects()[0].left,69);
  for(let i=0;i<10;i++){f.canvas.objects[0].src='data:image/png;base64,'+String(i).repeat(3*1024*1024);f.editor.changed('替换图片');}
  assert.ok(f.editor.getHistory().bytes<=f.editor.getHistory().byteLimit);assert.ok(f.editor.getHistory().entries.length<50);
  await f.editor.loadProject(draft('无图的新作品','no-images'));assert.ok(f.editor.getHistory().bytes<10000);
});

test('a save requested during history restoration waits for the final visible state before capturing it',async()=>{
  const f=persistence(draft('旧状态'));await f.store.ready;let release,pending=true;
  const idle=new Promise(resolve=>{release=()=>{pending=false;resolve();};});f.E.hasPendingOperations=()=>pending;f.E.whenIdle=()=>idle;
  const saving=f.store.save(true);assert.equal(f.read('work:draft-a'),undefined);f.set(draft('撤销后的状态'));release();await saving;
  assert.equal(f.read('work:draft-a').document.name,'撤销后的状态');assert.equal((await f.store.loadAutosave()).name,'撤销后的状态');
});

test('a delayed duplicate or image import cannot appear on a different page or resurrect an undone object',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);const rect=new f.runtime.Rect({width:60,height:40});f.editor.add(rect);
  let release;rect.clone=()=>new Promise(resolve=>{release=()=>resolve(new f.runtime.Rect({width:60,height:40}));});
  const copying=f.editor.duplicate();await f.editor.undo();release();assert.equal(await copying,false);assert.equal(f.canvas.getObjects().length,0);
  let imageRelease;f.context.fabric.FabricImage={fromURL:()=>new Promise(resolve=>{imageRelease=()=>resolve({});})};
  const importing=f.editor.insertImage('data:image/png;base64,AAA');await Promise.resolve();await f.editor.addPage();imageRelease();
  assert.equal(await importing,null);assert.equal(f.canvas.getObjects().length,0);
  f.editor.setBackground('#123456');const pendingSamePage=f.editor.insertImage('data:image/png;base64,BBB');await Promise.resolve();await f.editor.undo();imageRelease();
  assert.equal(await pendingSamePage,null,'undo on the same page also invalidates an unfinished import');assert.equal(f.canvas.getObjects().length,0);
});

test('keyboard save uses local save, Shift-S exports, and text editing retains native undo',async()=>{
  const f=fixture();await f.editor.newBlank(true);let saves=0,exports=0,prevented=0;
  f.context.document.getElementById('quickSaveBtn').click=()=>saves++;f.elements.get('saveBtn').click=()=>exports++;
  const event=(extra={})=>({key:'s',ctrlKey:true,target:{tagName:'BODY'},preventDefault(){prevented++;},...extra});
  f.dispatch('keydown',event());f.dispatch('keydown',event({shiftKey:true}));assert.equal(saves,1);assert.equal(exports,1);
  f.dispatch('keydown',event({defaultPrevented:true}));assert.equal(saves,1,'a control-owned key event must not invoke a global command');
  f.dispatch('keydown',event({key:'z',target:{tagName:'TEXTAREA'}}));assert.equal(prevented,2);assert.equal(f.editor.hasPendingOperations(),false);
});

test('new Chinese text wraps at grapheme boundaries when text and fonts change without expanding past the artboard',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);const text=f.run("text('你的大标题',100)");
  const input=f.elements.get('textValue');input.value='把每一步，留在创作里';input.oninput({isComposing:false});
  f.elements.get('fontFamily').value='Ma Shan Zheng';f.elements.get('fontFamily').onchange();
  assert.equal(text.type,'textbox');assert.equal(text.splitByGrapheme,true);assert.equal(text.text,'把每一步，留在创作里');
  assert.ok(text.width<=864);assert.ok(text.textLines.length>=2);assert.equal(f.editor.getSelectionOverflow().overflow,false);
});

test('explicit canvas fit scales and positions an existing rotated IText without changing its content or typography',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const text=new f.runtime.IText('把每一步，留在创作里',{left:950,top:-100,fontSize:130,fontFamily:'Ma Shan Zheng',angle:24,scaleX:1.2,scaleY:1.2});f.editor.add(text);
  const original=text.toObject(),overflow=f.editor.getSelectionOverflow();assert.equal(overflow.overflow,true);assert.ok(overflow.edges.right>0);
  assert.equal(f.editor.fitSelectionToCanvas(),true);const after=f.editor.getSelectionOverflow({margin:54});assert.equal(after.overflow,false);
  assert.equal(text.text,original.text);assert.equal(text.fontFamily,original.fontFamily);assert.equal(text.fontSize,original.fontSize);assert.equal(text.angle,24);
  assert.ok(text.scaleX<original.scaleX);assert.equal(text.scaleX/text.scaleY,1);assert.equal(f.editor.getHistory().entries.at(-1).label,'适配画布');
  await f.editor.undo();const undone=f.canvas.getObjects()[0];assert.equal(undone.left,original.left);assert.equal(undone.top,original.top);assert.equal(undone.scaleX,original.scaleX);
  await f.editor.redo();f.canvas.setActiveObject(f.canvas.getObjects()[0]);assert.equal(f.editor.getSelectionOverflow({margin:54}).overflow,false);
});

test('fit preserves group layout, respects locked descendants and does not record a no-op',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);
  const children=[new f.runtime.Rect({left:10,top:20,width:200,height:100}),new f.runtime.Rect({left:350,top:100,width:100,height:200})];
  const group=new f.runtime.Group(children,{left:-100,top:1100,scaleX:3,scaleY:3,angle:-12});f.editor.add(group);
  const relative=children.map(o=>({left:o.left,top:o.top,scaleX:o.scaleX,scaleY:o.scaleY}));assert.equal(f.editor.fitSelectionToCanvas({margin:20}),true);
  assert.equal(f.editor.getSelectionOverflow({margin:20}).overflow,false);assert.deepEqual(children.map(o=>({left:o.left,top:o.top,scaleX:o.scaleX,scaleY:o.scaleY})),relative);
  const count=f.editor.getHistory().entries.length;assert.equal(f.editor.fitSelectionToCanvas({margin:20}),false);assert.equal(f.editor.getHistory().entries.length,count);
  children[0].locked=true;group.set('left',-100);group.setCoords();assert.equal(f.editor.getSelectionOverflow().canFit,false);assert.equal(f.editor.fitSelectionToCanvas(),false);assert.equal(group.left,-100);
});

test('an unshrinkable uniform stroke rolls back a failed fit and does not pollute history',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);f.editor.resizeCanvas(100,100);
  const rect=new f.runtime.Rect({left:-50,top:-50,width:200,height:100,stroke:'#000000',strokeWidth:200,strokeUniform:true});f.editor.add(rect);
  const before={left:rect.left,top:rect.top,scaleX:rect.scaleX,scaleY:rect.scaleY},count=f.editor.getHistory().entries.length;
  assert.equal(f.editor.fitSelectionToCanvas(),false);assert.deepEqual({left:rect.left,top:rect.top,scaleX:rect.scaleX,scaleY:rect.scaleY},before);assert.equal(f.editor.getHistory().entries.length,count);
});

test('duplicating a page records the correct action and undo restores the original page count',async()=>{
  const f=fixture();await f.editor.newBlank(true);f.editor.setBackground('#123456');
  await f.editor.duplicatePage();assert.equal(f.editor.getHistory().entries.at(-1).label,'复制页面');assert.equal(f.editor.getPages().length,2);
  assert.equal(f.editor.getProject().pages[1].canvas.background,'#123456');
  await f.editor.undo();assert.equal(f.editor.getPages().length,1);await f.editor.redo();assert.equal(f.editor.getPages().length,2);
});

test('touch layer multi-select adds and removes real Fabric members without moving or rotating them',async()=>{
  const f=fixture({realCanvas:true});
  try{
    await f.editor.newBlank(true);
    const shapes=[new f.runtime.Rect({name:'A',left:100,top:80,width:200,height:90,angle:17,skewX:8,scaleX:1.2,scaleY:.8}),new f.runtime.Rect({name:'B',left:450,top:300,width:160,height:130,angle:-25}),new f.runtime.Ellipse({name:'C',left:300,top:650,rx:50,ry:90,angle:30})];
    for(const shape of shapes)f.editor.add(shape);f.canvas.discardActiveObject();
    const original=shapes.map(o=>o.calcTransformMatrix()),count=f.editor.getHistory().entries.length;
    const click=name=>f.elements.get('layers').children.find(row=>row.children[0].textContent.endsWith(name)).children[0].onclick();
    const check=()=>shapes.forEach((o,index)=>o.calcTransformMatrix().forEach((value,key)=>assert.ok(Math.abs(value-original[index][key])<1e-8,`${o.name} matrix ${key}`)));
    assert.equal(f.editor.setLayerMultiSelect(true),true);assert.equal(f.editor.getLayerMultiSelect(),true);
    for(let cycle=0;cycle<8;cycle++){
      click('A');click('B');click('C');assert.equal(f.canvas.getActiveObject().type,'activeselection');assert.deepEqual(f.canvas.getActiveObjects().map(o=>o.name),['A','B','C']);check();
      click('B');assert.deepEqual(f.canvas.getActiveObjects().map(o=>o.name),['A','C']);check();
      click('A');assert.equal(f.canvas.getActiveObject(),shapes[2]);check();click('C');assert.equal(f.canvas.getActiveObject(),undefined);check();
    }
    click('A');click('B');const active=f.canvas.getActiveObject();f.editor.setLayerMultiSelect(false);assert.equal(f.canvas.getActiveObject(),active);
    assert.equal(f.editor.getHistory().entries.length,count,'selection changes must not consume undo steps');
    click('C');assert.equal(f.canvas.getActiveObject(),shapes[2]);check();
  }finally{await f.canvas.dispose();}
});

test('changing transformed multi-selection membership and then grouping preserves real world geometry',async()=>{
  const f=fixture({realCanvas:true});
  try{
    await f.editor.newBlank(true);const shapes=['A','B','C'].map((name,i)=>new f.runtime.Rect({name,left:100+i*240,top:100+i*70,width:100,height:80,angle:i*20}));
    for(const shape of shapes)f.editor.add(shape);f.canvas.discardActiveObject();f.editor.setLayerMultiSelect(true);
    const click=name=>f.elements.get('layers').children.find(row=>row.children[0].textContent.endsWith(name)).children[0].onclick();
    click('A');click('B');const selection=f.canvas.getActiveObject();selection.set({left:selection.left+70,top:selection.top+50,angle:15,scaleX:.8,scaleY:.8});selection.setCoords();f.editor.changed('移动多选');
    const expected=shapes.map(o=>o.calcTransformMatrix()),check=()=>shapes.forEach((o,i)=>o.calcTransformMatrix().forEach((value,j)=>assert.ok(Math.abs(value-expected[i][j])<1e-7,`${o.name} matrix ${j}`)));
    click('C');check();click('B');check();assert.deepEqual(f.canvas.getActiveObjects().map(o=>o.name),['A','C']);
    f.editor.groupSelection();assert.equal(f.canvas.getActiveObject().type,'group');check();f.editor.ungroupSelection();check();
    await f.editor.undo();assert.equal(f.canvas.getObjects().find(o=>o.type==='group').getObjects().length,2);
  }finally{await f.canvas.dispose();}
});

test('layer multi-select excludes locked objects and locked group descendants while ordinary inspection remains available',async()=>{
  const f=fixture({realCanvas:true});
  try{
    await f.editor.newBlank(true);const editable=new f.runtime.Rect({name:'Editable',left:40,top:50,width:100,height:100}),locked=new f.runtime.Rect({name:'Locked',left:250,top:50,width:100,height:100,locked:true}),group=new f.runtime.Group([new f.runtime.Rect({width:50,height:60,locked:true})],{name:'FixedGroup',left:400,top:50});
    for(const o of [editable,locked,group])f.editor.add(o);f.canvas.discardActiveObject();f.editor.setLayerMultiSelect(true);
    const click=name=>f.elements.get('layers').children.find(row=>row.children[0].textContent.endsWith(name)).children[0].onclick();
    click('Editable');assert.equal(click('Locked'),false);assert.equal(click('FixedGroup'),false);assert.equal(f.canvas.getActiveObject(),editable);
    f.editor.setLayerMultiSelect(false);click('Locked');assert.equal(f.canvas.getActiveObject(),locked);assert.equal(f.editor.canEdit(locked,{silent:true}),false);
    f.editor.setLayerMultiSelect(true);click('Editable');assert.deepEqual(f.canvas.getActiveObjects(),[editable]);assert.equal(locked.left,250);
    locked.set('locked',false);click('Locked');assert.equal(f.canvas.getActiveObject().type,'activeselection');
    const before=locked.calcTransformMatrix();f.elements.get('layers').children.find(row=>row.children[0].textContent.endsWith('Locked')).children[1].onclick();
    assert.equal(locked.locked,true);assert.equal(f.canvas.getActiveObject(),editable,'locking one selected layer must remove it from the draggable ActiveSelection');
    editable.set('left',editable.left+50);editable.setCoords();assert.deepEqual(locked.calcTransformMatrix(),before);
  }finally{await f.canvas.dispose();}
});

test('engineering backup exports the visible document even when local IndexedDB saving is unavailable',async()=>{
  const f=fixture();await f.editor.newBlank(true);f.editor.setBackground('#123456');let localAttempts=0,downloaded;
  f.context.window.ZTH_WORKS={save:async()=>{localAttempts++;throw Error('QuotaExceededError');}};
  f.context.captureDownload=async(blob,name)=>{downloaded={document:JSON.parse(await blob.text()),name};};f.run('download=captureDownload');
  await f.elements.get('saveBtn').onclick();assert.equal(localAttempts,0);assert.equal(downloaded.document.pages[0].canvas.background,'#123456');assert.match(downloaded.name,/\.zthpmsj$/);
  const gate=f.pauseLoad(),undo=f.editor.undo();await gate.entered;const backup=f.elements.get('saveBtn').onclick();gate.release();await undo;await backup;
  assert.equal(downloaded.document.pages[0].canvas.background,'#ffffff','backup requested during undo exports the final stable state');
});

test('Ctrl-S and Shift-S commit focused text and numeric fields while Ctrl-Z retains native input undo',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);const text=new f.runtime.Textbox('原文',{width:300,fontSize:24});f.editor.add(text);
  let saved,backedUp,prevented=0;
  f.context.document.getElementById('quickSaveBtn').click=()=>{saved=f.editor.getProject();};f.elements.get('saveBtn').click=()=>{backedUp=f.editor.getProject();};
  const input=f.elements.get('textValue');input.tagName='TEXTAREA';input.value='焦点中的新文字';f.context.document.activeElement=input;
  const send=(key='s',extra={})=>f.dispatch('keydown',{key,ctrlKey:true,target:f.context.document.activeElement,preventDefault(){prevented++;},...extra});
  send();assert.equal(saved.pages[0].canvas.objects[0].text,'焦点中的新文字');
  const position=f.elements.get('posY');position.tagName='INPUT';position.value='321';f.context.document.activeElement=position;
  send('s',{shiftKey:true});assert.equal(backedUp.pages[0].canvas.objects[0].top,321);assert.equal(prevented,2);
  const count=f.editor.getHistory().entries.length;send('z');assert.equal(prevented,2);assert.equal(f.editor.getHistory().entries.length,count);assert.equal(f.editor.hasPendingOperations(),false);
});

test('Ctrl-S during IME waits for committed text rather than saving the candidate string',async()=>{
  const f=fixture({realObjects:true});await f.editor.newBlank(true);f.editor.add(new f.runtime.Textbox('原文',{width:300,fontSize:24}));
  const input=f.elements.get('textValue');input.tagName='TEXTAREA';f.context.document.activeElement=input;let saves=0,saved;
  f.context.document.getElementById('quickSaveBtn').click=()=>{saves++;saved=f.editor.getProject();};
  input.oncompositionstart();input.value='pinyin';f.dispatch('keydown',{key:'s',ctrlKey:true,isComposing:true,target:input,preventDefault(){}});assert.equal(saves,0);
  input.value='中文已提交';input.oncompositionend();input.dispatch('compositionend');await Promise.resolve();
  assert.equal(saves,1);assert.equal(saved.pages[0].canvas.objects[0].text,'中文已提交');
});

function prepareBootFixture(readyState){
  const f=fixture();f.context.document.readyState=readyState;f.context.document.fonts.ready=Promise.resolve();
  const fonts={ready:Promise.resolve(),list:()=>[],collectUsed:()=>[],loadEmbedded:async()=>{}};
  f.context.window.ZTH_FONTS=f.context.ZTH_FONTS=fonts;f.elements.get('fontFamily').options=[];
  f.context.navigator={};f.context.location={protocol:'file:'};f.context.ZTH_TEMPLATES=[];
  f.run('dbGet=async()=>undefined');
  const bootLine=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8').match(/^init\(\)\.then\([^\n]+\);\s*$/m)[0];
  const api={...f,boot:()=>f.run(bootLine),renderCount:0};
  api.register=(templateReady=Promise.resolve(),worksReady=Promise.resolve())=>{
    f.context.window.ZTH_TEMPLATE=f.context.ZTH_TEMPLATE={ready:templateReady,renderLibrary:body=>{api.renderCount++;body.replaceChildren({version:'4.0',filters:true});}};
    f.context.window.ZTH_WORKS=f.context.ZTH_WORKS={ready:worksReady,loadAutosave:async()=>null,activate:async()=>{},save:async()=>({draft:true})};
  };
  return api;
}

test('cold file startup waits for later extension scripts and their readiness before first template render',async()=>{
  const f=prepareBootFixture('loading');let templatesReady,worksReady;
  const templates=new Promise(resolve=>{templatesReady=resolve;}),works=new Promise(resolve=>{worksReady=resolve;});
  assert.ok(f.editor,'extensions can access the synchronous editor API before DOMContentLoaded');
  const body=f.context.document.getElementById('libraryBody'),boot=f.boot();await new Promise(setImmediate);
  assert.equal(body.children.length,0,'cached fonts must not render the legacy fallback while parsing later scripts');assert.equal(f.context.window.ZTH_READY,undefined);
  f.register(templates,works);f.context.document.readyState='interactive';f.dispatch('DOMContentLoaded',{});await new Promise(setImmediate);
  assert.equal(f.renderCount,0);templatesReady();await new Promise(setImmediate);assert.equal(f.renderCount,0,'works readiness is also awaited');
  worksReady();await boot;
  assert.equal(f.renderCount,1);assert.equal(body.children[0].version,'4.0');assert.equal(body.children[0].filters,true);assert.equal(f.context.window.ZTH_READY,true);
  assert.equal(f.elements.get('bootScreen').removed,true);assert.equal(f.editor.getProject().name,'未命名作品');
});

test('startup on an already parsed document does not wait for a DOMContentLoaded event that has passed',async()=>{
  const f=prepareBootFixture('complete');f.register();await f.boot();
  assert.equal(f.context.window.ZTH_READY,true);assert.equal(f.renderCount,1);
});
