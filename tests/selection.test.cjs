'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const colors = require('../app/color-tools.js');

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve=done; });
  return { promise, resolve };
}

function qrObject(name, extra={}) {
  return {
    name, type:'image', role:'qr', left:120, top:230, angle:17,
    width:300, height:300, scaleX:.5, scaleY:.5, opacity:.8,
    originX:'center', originY:'center', flipX:true, flipY:false,
    qrText:'https://example.org/original', qrDark:'#123456', qrLight:'#fefefe',
    getScaledWidth() { return this.width*this.scaleX; },
    getScaledHeight() { return this.height*this.scaleY; },
    set(properties) { Object.assign(this,properties); },
    setCoords() {}, ...extra
  };
}

function fixture({generate=async()=> 'data:image/png;base64,new',loadImage=async()=>qrObject('new',{width:700,height:700})}={}) {
  const elements=new Map(),messages=[],changes=[];
  const first=qrObject('First QR'),second=qrObject('Second QR',{left:500});
  const objects=[{name:'Before'},first,second,{name:'After'}];
  let active=first;
  function element(id) {
    if(!elements.has(id))elements.set(id,{
      value:'',listeners:new Map(),
      addEventListener(type,fn) {this.listeners.set(type,fn);},
      showModal() {this.open=true;},
      close() {this.open=false;this.listeners.get('close')?.();},
      scrollIntoView() {},click() {return this.onclick?.();}
    });
    return elements.get(id);
  }
  const canvas={
    getActiveObject:()=>active,getObjects:()=>objects,
    remove(o) {const index=objects.indexOf(o);if(index>=0)objects.splice(index,1);},
    insertAt(index,o) {objects.splice(index,0,o);},
    setActiveObject(o) {active=o;},requestRenderAll() {},on() {}
  };
  const context=vm.createContext({
    ZTH_EDITOR:{canvas,changed:()=>changes.push(true),toast:m=>messages.push(m),canEdit:o=>!!o&&!o.locked},
    ZTH_COLORS:colors,
    fabric:{FabricImage:{fromURL:loadImage}},
    document:{getElementById:element,body:{classList:{remove() {},add() {}}}},
    window:{makeQR:generate}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../app/selection-tools.js'),'utf8'),context,{filename:'selection-tools.js'});
  return {first,second,objects,changes,messages,element,setActive:o=>{active=o;}};
}

test('QR replacement preserves layer, position, rotation and persisted QR colors',async()=>{
  const f=fixture();f.element('selectionQR').onclick();
  assert.equal(f.element('selectedQRText').value,f.first.qrText);
  assert.equal(f.element('selectedQRDark').value,'#123456');
  f.element('selectedQRText').value='https://example.org/updated';
  f.element('selectedQRDark').value='#334455';
  f.element('selectedQRLight').value='#eeeeee';
  await f.element('applySelectedQR').onclick();
  const replacement=f.objects[1];
  assert.notEqual(replacement,f.first);
  for(const key of ['left','top','angle','originX','originY','opacity','flipX','flipY'])assert.equal(replacement[key],f.first[key],key);
  assert.equal(replacement.getScaledWidth(),150);
  assert.equal(replacement.getScaledHeight(),150);
  assert.equal(replacement.qrText,'https://example.org/updated');
  assert.equal(replacement.qrDark,'#334455');
  assert.equal(replacement.qrLight,'#eeeeee');
  assert.equal(f.objects[2],f.second);
  assert.equal(f.changes.length,1);
});

test('closing a pending QR request and opening another element never replaces the later selection',async()=>{
  const generation=deferred();let imageLoads=0;
  const f=fixture({generate:()=>generation.promise,loadImage:async()=>{imageLoads++;return qrObject('new');}});
  f.element('selectionQR').onclick();const operation=f.element('applySelectedQR').onclick();
  f.element('qrEditDialog').close();f.setActive(f.second);f.element('selectionQR').onclick();
  generation.resolve('data:image/png;base64,new');await operation;
  assert.equal(imageLoads,0);
  assert.equal(f.objects[1],f.first);assert.equal(f.objects[2],f.second);
  assert.equal(f.changes.length,0);assert.equal(f.element('applySelectedQR').disabled,false);
});

test('an image loading after its QR dialog closes cannot resurrect a removed element',async()=>{
  const loading=deferred(),started=deferred();
  const f=fixture({loadImage:()=>{started.resolve();return loading.promise;}});
  f.element('selectionQR').onclick();const operation=f.element('applySelectedQR').onclick();await started.promise;
  f.element('qrEditDialog').close();f.objects.splice(f.objects.indexOf(f.first),1);
  loading.resolve(qrObject('new'));await operation;
  assert.equal(f.objects.length,3);assert.ok(!f.objects.some(o=>o.name==='new'));assert.equal(f.changes.length,0);
});

test('locking the target during QR loading cancels its replacement and releases the button',async()=>{
  const loading=deferred(),started=deferred();
  const f=fixture({loadImage:()=>{started.resolve();return loading.promise;}});
  f.element('selectionQR').onclick();const operation=f.element('applySelectedQR').onclick();await started.promise;
  f.first.locked=true;loading.resolve(qrObject('new'));await operation;
  assert.equal(f.objects[1],f.first);assert.equal(f.changes.length,0);
  assert.equal(f.element('applySelectedQR').disabled,false);
  assert.ok(f.messages.some(message=>message.includes('重新选中')));
});

test('double clicks while QR generation is pending only start one replacement',async()=>{
  const generation=deferred();let calls=0;
  const f=fixture({generate:()=>{calls++;return generation.promise;}});
  f.element('selectionQR').onclick();
  const first=f.element('applySelectedQR').onclick(),second=f.element('applySelectedQR').onclick();
  generation.resolve('data:image/png;base64,new');await Promise.all([first,second]);
  assert.equal(calls,1);assert.equal(f.changes.length,1);assert.equal(f.objects.length,4);
});
