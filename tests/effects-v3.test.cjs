'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('fabric'),Library=require('../app/element-library.js'),Effects=require('../app/object-effects.js'),A=require('../app/algorithms.js');
F.FabricObject.customProperties=[...new Set([...F.FabricObject.customProperties,'name','role','locked','elementPaint'])];
const project=objects=>({format:'zthpmsj',schema:1,pages:[{width:1080,height:1440,canvas:{objects}}]});
test('48 original vectors parse with finite geometry, search by category, and survive project restore',async()=>{
 assert.ok(Library.items.length>=36);assert.ok(Library.categories.length>=4);
 assert.equal(new Set(Library.items.map(i=>i.id)).size,Library.items.length);
 for(const item of Library.items){
  const shape=Library.create(item.id,F,'#12abef');
  assert.ok(shape instanceof F.Path);assert.ok(shape.path.length>0);
  assert.ok(Number.isFinite(shape.width)&&Number.isFinite(shape.height)&&shape.width>0&&shape.height>=0,item.id);
  shape.scaleToWidth(160);shape.setCoords();const box=shape.getBoundingRect();
  assert.ok(Number.isFinite(box.width)&&box.width>0&&box.height>0,item.id);
  const saved=shape.toObject();A.validateProject(project([saved]));
  const [restored]=await F.util.enlivenObjects([saved]);
  assert.deepEqual(restored.path,shape.path,item.id);assert.equal(restored.elementPaint,shape.elementPaint);
  assert.equal(restored.stroke,shape.stroke);assert.equal(restored.fill,shape.fill);
 }
 assert.ok(Library.search('arrow','方向箭头').length>=5);
 assert.equal(Library.search('编程')[0].id,'code');assert.equal(Library.search('does-not-exist').length,0);
});
test('quick ink recolors open strokes without closing them; explicit fill remains available',()=>{
 const open=Library.create('check',F);
 assert.equal(Effects.paint(open,'ink','#ff3300'),true);assert.equal(open.stroke,'#ff3300');assert.equal(open.fill,null);
 Effects.paint(open,'fill','#aabbcc');assert.equal(open.fill,'#aabbcc');
 Effects.noFill(open);assert.equal(open.fill,null);assert.equal(open.stroke,'#ff3300');
});
test('group paint respects any locked descendant and updates cached bounds for wide outlines',()=>{
 const icon=Library.create('check',F),rect=new F.Rect({width:50,height:40,left:100,fill:'#123456'}),group=new F.Group([icon,rect]);
 rect.locked=true;const before=JSON.stringify(group.toObject());
 assert.equal(Effects.paint(group,'fill','#ff0000'),false);
 assert.equal(Effects.shadow(group,{enabled:true},F),false);
 assert.equal(Effects.objectBackground(group,'#ffffff'),false);
 assert.equal(JSON.stringify(group.toObject()),before);
 rect.locked=false;const oldWidth=group.width;
 Effects.paint(group,'strokeWidth',25);assert.ok(group.width>oldWidth);
 assert.equal(rect.strokeWidth,25);assert.equal(icon.strokeWidth,25);
 assert.equal(Effects.paint(group,'strokeWidth',-1),false);
});
test('multi-selection shadow edits preserve the untouched per-object fields',()=>{
 const a=new F.Rect({width:20,height:20}),b=new F.Rect({width:25,height:25,left:50});
 Effects.shadow(a,{color:'#ff0000',blur:10,offsetX:-10,alpha:.2},F);
 Effects.shadow(b,{color:'#0000ff',blur:35,offsetX:20,alpha:.6},F);
 const selection=new F.ActiveSelection([a,b]);
 assert.equal(Effects.shadow(selection,{offsetY:40},F),true);
 assert.equal(a.shadow.blur,10);assert.equal(b.shadow.blur,35);
 assert.equal(a.shadow.offsetX,-10);assert.equal(b.shadow.offsetX,20);
 assert.equal(a.shadow.offsetY,40);assert.equal(b.shadow.offsetY,40);
 assert.equal(new F.Color(a.shadow.color).getAlpha(),.2);assert.equal(new F.Color(b.shadow.color).getAlpha(),.6);
 Effects.shadow(selection,{enabled:false},F);assert.equal(a.shadow,null);assert.equal(b.shadow,null);
});
test('outline, transparent fill, object background and shadow survive validate/serialize/enliven and undo snapshots',async()=>{
 const icon=Library.create('star',F);const undo=icon.toObject();
 Effects.noFill(icon);Effects.paint(icon,'stroke','#123abc');Effects.paint(icon,'strokeWidth',7);
 Effects.paint(icon,'paintFirst','stroke');Effects.objectBackground(icon,'#eeddaa');
 Effects.shadow(icon,{color:'#7744aa',alpha:.4,blur:24,offsetX:-12,offsetY:19},F);
 const saved=icon.toObject();A.validateProject(project([saved]));
 const [restored]=await F.util.enlivenObjects([saved]);
 assert.equal(restored.fill,null);assert.equal(restored.stroke,'#123abc');assert.equal(restored.strokeWidth,7);
 assert.equal(restored.backgroundColor,'#eeddaa');assert.equal(restored.paintFirst,'stroke');
 assert.equal(restored.shadow.offsetX,-12);assert.equal(restored.shadow.blur,24);assert.equal(new F.Color(restored.shadow.color).getAlpha(),.4);
 Effects.objectBackground(restored,'');assert.equal(restored.backgroundColor,'');
 const [undone]=await F.util.enlivenObjects([undo]);assert.equal(undone.stroke,null);assert.equal(undone.shadow,null);assert.equal(undone.fill,'#7352dc');
});

let NodeFabric;
try{NodeFabric=require('fabric/node');new NodeFabric.Textbox('canvas probe');}catch{NodeFabric=null;}
test('real text stroke, line highlight, object background and shadow restore the same rendered PNG',{skip:!NodeFabric&&'Native canvas is not installed; browser rendering QA is required'},async()=>{
 const N=NodeFabric,canvas=new N.StaticCanvas(null,{width:360,height:200,enableRetinaScaling:false,renderOnAddRemove:false});
 const text=new N.Textbox('ZTH Studio',{left:30,top:45,width:290,fontSize:42,fontFamily:'Arial',fill:'#222222'});
 canvas.add(text);canvas.renderAll();const plain=canvas.toDataURL();
 Effects.noFill(text);Effects.paint(text,'stroke','#3344aa');Effects.paint(text,'strokeWidth',2);
 Effects.paint(text,'paintFirst','stroke');Effects.textBackground(text,'#ffe388');Effects.objectBackground(text,'#dae9ff');
 Effects.shadow(text,{color:'#553366',alpha:.5,blur:8,offsetX:5,offsetY:7},N);
 canvas.renderAll();const styled=canvas.toDataURL();assert.notEqual(styled,plain);
 const saved=canvas.toObject();A.validateProject(project(saved.objects));
 const restored=new N.StaticCanvas(null,{width:360,height:200,enableRetinaScaling:false,renderOnAddRemove:false});
 await restored.loadFromJSON(saved);restored.renderAll();
 assert.equal(restored.toDataURL(),styled,'round-trip must preserve rendered styling');
 const copy=restored.getObjects()[0];assert.equal(copy.textBackgroundColor,'#ffe388');
 copy.locked=true;assert.equal(Effects.textBackground(copy,''),false);assert.equal(copy.textBackgroundColor,'#ffe388');
 copy.locked=false;Effects.textBackground(copy,'');Effects.objectBackground(copy,'');Effects.shadow(copy,{enabled:false},N);
 assert.equal(copy.textBackgroundColor,'');assert.equal(copy.backgroundColor,'');assert.equal(copy.shadow,null);
 await canvas.dispose();await restored.dispose();
});
