'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {templates}=require('../app/templates.js');
const guides=require('../app/design-guides.js');
const F=require('fabric');
const added=templates.filter(t=>t.edition===4);
test('4.0 adds practical original compositions across screen, print, card and long formats',()=>{
 assert.ok(added.length>=20);assert.equal(new Set(templates.map(t=>t.id)).size,templates.length);
 assert.ok(new Set(added.map(t=>t.purpose)).size>=18);
 const signatures=new Set(added.map(t=>JSON.stringify(t.build().objects.map(o=>({kind:o.kind,left:o.left,top:o.top,width:o.width,height:o.height,points:o.points})))));
 assert.equal(signatures.size,added.length,'new originals must differ in their geometry, not just their palette');
 for(const shape of ['landscape','portrait','square'])assert.ok(added.some(t=>t.orientation===shape));
 for(const [w,h]of [[1063,638],[638,1063],[1748,2480],[3508,2480],[1080,2700],[1920,1080]])assert.ok(added.some(t=>t.width===w&&t.height===h));
 for(const t of templates){assert.ok(t.purpose&&t.exportTip&&t.layoutTips);assert.ok(t.copyTips.length>=2);const a=t.build();a.objects.length=0;assert.ok(t.id==='blank'||t.build().objects.length>0);}
});
test('new template paths and explicit text frames fit their pages before real-font pixel QA',()=>{
 for(const t of added){const s=t.build();for(const o of s.objects){
  for(const key of ['left','top','fontSize','width','height','radius'])if(o[key]!==undefined)assert.ok(Number.isFinite(o[key]),`${t.id}: ${key}`);
  if(o.kind==='text'){
   assert.ok(o.width>0&&o.fontSize>0);assert.ok(o.left>=0&&o.top>=0,`${t.id}: ${o.text}`);
   assert.ok(o.left+o.width<=s.width,`${t.id}: text frame exceeds width: ${o.text}`);
   const lines=o.text.split('\n').length;
   assert.ok(o.top+o.fontSize*1.16*(1+(lines-1)*o.lineHeight)<s.height,`${t.id}: explicit lines exceed height: ${o.text}`);
   assert.ok(['ZTH Sans','ZCOOL XiaoWei','Ma Shan Zheng','Roboto Mono'].includes(o.fontFamily));
   assert.ok(!/[^\x00-\x7f]/.test(o.text)||o.fontFamily!=='Roboto Mono','Chinese copy must not depend on system fallback from an ASCII font');
  }
  if(o.kind==='path'){const p=new F.Path(o.path,o);assert.ok(Number.isFinite(p.width)&&Number.isFinite(p.height));}
 }}
});
test('template filters combine purpose, shape and search without hiding newly added categories',()=>{
 const filter=options=>templates.filter(t=>guides.matchesTemplate(t,options));
 assert.ok(filter({orientation:'long'}).some(t=>t.id==='onboarding-long'));
 assert.ok(filter({orientation:'wide'}).some(t=>t.id==='event-ticket'));
 assert.ok(filter({purpose:'联系方式',orientation:'portrait'}).some(t=>t.id==='business-portrait'));
 assert.equal(filter({purpose:'联系方式',orientation:'square'}).length,0);
 assert.ok(filter({query:'1063'}).some(t=>t.id==='business-landscape'));
 assert.ok(filter({query:'a4'}).some(t=>t.id==='resume-a4'));
 assert.equal(filter({query:'no-such-template-zz'}).length,0);
});
test('size references use valid integer pixels and correct print-size arithmetic',()=>{
 assert.ok(guides.sizes.length>=20);assert.equal(new Set(guides.sizes.map(s=>s.id)).size,guides.sizes.length);
 for(const s of guides.sizes){assert.ok(Number.isInteger(s.width)&&s.width>0&&Number.isInteger(s.height)&&s.height>0);assert.equal(s.ratio,guides.ratio(s.width,s.height));
  if(s.mmWidth){assert.ok(Math.abs(s.width-s.mmWidth/25.4*s.ppi)<=1);assert.ok(Math.abs(s.height-s.mmHeight/25.4*s.ppi)<=1);assert.match(s.exportTip,/出血/);}
 }
 assert.ok(guides.searchSizes('名片','印刷').length===2);assert.ok(guides.searchSizes('16:9','屏幕').some(s=>s.id==='slide'));
});
test('offline lessons are discoverable and reference only existing size presets',()=>{
 assert.ok(guides.lessons.length>=12);assert.ok(new Set(guides.lessons.map(l=>l.category)).size>=5);
 for(const l of guides.lessons){assert.ok(l.summary&&l.steps.length>=3);for(const id of l.related||[])assert.ok(guides.sizes.some(s=>s.id===id),`${l.id}: ${id}`);}
 assert.ok(guides.searchLessons('出血').some(l=>l.id==='bleed'));assert.equal(guides.searchLessons('出血','颜色').length,0);
 assert.match(guides.lessons.find(l=>l.id==='formats').steps.join(' '),/PDF 按页面图像/);
});
test('real DOM library filters expose details and route selection without modifying originals',async()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
 const ids=['templateName','projectName','templateDialog','saveUserTemplate','exportUserTemplate','replaceImageBtn','replaceImageInput','imageSlot','keepRatio'];
 const dom=new JSDOM('<body>'+ids.map(id=>'<input id="'+id+'">').join('')+'<main id="library"></main>',{runScripts:'outside-only'}),w=dom.window;
 let applied;const before=JSON.stringify(templates.map(t=>t.build()));
 w.ZTH_EDITOR={dbGet:async()=>[],canvas:{getActiveObject:()=>null},canEdit:()=>false,applyTemplate:async t=>{applied=t.id;},toast(){}};
 w.ZTH_TEMPLATES=templates;w.fabric={};w.IntersectionObserver=class{observe(){}disconnect(){}};
 for(const file of ['design-guides.js','template-tools.js'])w.eval(fs.readFileSync(path.join(__dirname,'../app',file),'utf8'));
 await w.ZTH_TEMPLATE.ready;const body=w.document.getElementById('library');w.ZTH_TEMPLATE.renderLibrary(body);
 assert.equal(body.querySelectorAll('.template-v4-card').length,49);
 const shape=body.querySelector('[aria-label="画面方向和比例"]'),purpose=body.querySelector('[aria-label="模板用途"]');
 shape.value='portrait';purpose.value='联系方式';shape.onchange();assert.equal(body.querySelectorAll('.template-v4-card').length,1);
 const card=body.querySelector('.template-v4-card');assert.match(card.textContent,/个人名片/);assert.match(card.querySelector('.template-card').getAttribute('aria-label'),/预览/);
 card.querySelector('.template-v4-card-actions').lastElementChild.click();await Promise.resolve();assert.equal(applied,'business-portrait');
 assert.equal(JSON.stringify(templates.map(t=>t.build())),before);
 const search=body.querySelector('input[type="search"]');search.value='<script>unknown</script>';search.oninput();assert.equal(body.querySelectorAll('.template-v4-card').length,0);assert.equal(body.querySelectorAll('script').length,0);dom.window.close();
});
test('knowledge panel switches categories and passes an isolated size preset to the editor',async()=>{
 const{JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync(path.join(__dirname,'../app/design-guides.js'),'utf8'));
 let picked;const body=w.document.querySelector('main');w.ZTH_DESIGN_GUIDES.render(body,{onSelectSize:p=>{picked=p;p.width=1;}});
 assert.equal(body.querySelectorAll('.template-v4-guide-card').length,20);body.querySelector('.template-v4-guide-card button').click();await Promise.resolve();assert.ok(picked);assert.equal(w.ZTH_DESIGN_GUIDES.sizes[0].width,1080);
 const tabs=body.querySelectorAll('.template-v4-tabs button');tabs[1].click();assert.equal(tabs[1].getAttribute('aria-pressed'),'true');assert.equal(body.querySelectorAll('.template-v4-guide-card').length,14);
 const search=body.querySelector('input');search.value='出血';search.oninput();assert.ok(body.textContent.includes('出血和安全距离'));assert.equal(body.querySelectorAll('.template-v4-guide-card button').length>0,true);dom.window.close();
});
