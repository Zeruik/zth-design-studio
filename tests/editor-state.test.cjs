'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const fabric=require('fabric');

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
      classList:{add() {},remove() {},toggle() {}},append() {},replaceChildren() {},addEventListener() {}
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
    async loadFromJSON(data) {if(loadError)throw loadError;this.objects=data.objects||[];}
    toObject() {return {objects:this.objects};}
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
    document:{getElementById:element,querySelectorAll:()=>[],addEventListener() {},createElement:()=>element('generated-'+nextId++),fonts:{add() {}}},
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
