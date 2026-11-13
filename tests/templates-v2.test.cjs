const {test}=require('node:test'),assert=require('node:assert/strict');
const {templates}=require('../app/templates.js');
const Brand=require('../app/brand-assets.js');
const added=['screen-landscape','square-notice','story-portrait','wide-banner','paper-a4','recruit-landscape','postcard-landscape','social-portrait'];
test('new template collection provides distinct practical aspect ratios',()=>{
 const scenes=added.map(id=>templates.find(t=>t.id===id).build());
 assert.equal(scenes.length,8);
 assert.equal(new Set(scenes.map(s=>s.width+':'+s.height)).size,8);
 assert.ok(scenes.some(s=>s.width/s.height>=2.5));
 assert.ok(scenes.some(s=>s.height/s.width>=1.7));
 assert.ok(scenes.some(s=>s.width===2480&&s.height===3508));
 for(const s of scenes)for(const o of s.objects){
  if(o.kind==='text'){
   assert.ok(o.left>=0&&o.top>=0);
   assert.ok(o.left+o.width<=s.width,`${s.width} × ${s.height}: ${o.text}`);
   const lines=o.text.split('\n').length;
   assert.ok(o.top+lines*o.fontSize*o.lineHeight<=s.height,`Text exceeds page: ${o.text}`);
  }
  if(o.kind==='image')assert.ok(o.left+o.boxW<=s.width&&o.top+o.boxH<=s.height);
 }
});
test('template factories return independent copies',()=>{
 for(const t of templates){const a=t.build(),before=JSON.stringify(t.build());a.objects.length=0;a.background='#123456';assert.equal(JSON.stringify(t.build()),before,t.id);}
});
test('brand mattes remove backgrounds and lettering counters without changing geometry',()=>{
 const pixels=new Uint8ClampedArray([255,255,255,255,0,0,0,255,128,128,128,255,253,253,253,255]);
 const copy=new Uint8ClampedArray(pixels),dark=Brand.processPixels(pixels,4,1,'dark'),light=Brand.processPixels(pixels,4,1,'light');
 assert.deepEqual(pixels,copy);
 assert.equal(dark[3],0);assert.equal(dark[7],255);assert.equal(dark[15],0);
 assert.ok(dark[11]>100&&dark[11]<140);assert.equal(dark[8],0);
 assert.equal(light[3],255);assert.equal(light[7],0);assert.equal(light[8],255);
});
test('color brand matte keeps saturated source pixels and removes white',()=>{
 const pixels=new Uint8ClampedArray([255,255,255,255,236,194,61,255,15,104,159,255,0,0,0,255]);
 const out=Brand.processPixels(pixels,4,1,'color');
 assert.equal(out[3],0);assert.deepEqual(out.slice(4),pixels.slice(4));
 assert.equal(Brand.list().length,7);
});
