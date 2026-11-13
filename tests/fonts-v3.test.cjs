const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const A=require('../app/algorithms.js');
const sources=JSON.parse(fs.readFileSync('app/assets/fonts/SOURCES.json','utf8'));
const fontData=new Map([['ZTH Sans','ZTHSans.woff2'],['ZCOOL XiaoWei','ZCOOLXiaoWei.woff2'],['Ma Shan Zheng','MaShanZheng.woff2'],['Roboto Mono','RobotoMono.woff2']].map(([family,file])=>[family,'data:font/woff2;base64,'+fs.readFileSync('app/assets/fonts/'+file).toString('base64')]));
const fontLicenses=Object.fromEntries([['ZTH Sans','OFL.txt'],['ZCOOL XiaoWei','ZCOOLXiaoWei-OFL.txt'],['Ma Shan Zheng','MaShanZheng-OFL.txt'],['Roboto Mono','RobotoMono-OFL.txt']].map(([family,file])=>[family,fs.readFileSync('app/assets/fonts/'+file,'utf8').replace(/\r\n/g,'\n')]));
test('three offline fonts have complete licensed, pinned WOFF2 assets',()=>{
 assert.equal(sources.fonts.length,3);
 for(const font of sources.fonts){const bytes=fs.readFileSync('app/assets/fonts/'+font.file);assert.equal(bytes.subarray(0,4).toString(),'wOF2');assert.equal(bytes.length,font.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),font.sha256);assert.ok(bytes.length<10*1024*1024);assert.match(fs.readFileSync('app/assets/fonts/'+font.license,'utf8'),/SIL OPEN FONT LICENSE Version 1.1/);assert.match(font.source,/^https:\/\/raw.githubusercontent.com\/google\/fonts\//);}
 assert.ok(sources.fonts.filter(f=>f.glyphs>7000).length>=2);
});
test('portable validation accepts all four real fonts and rejects unbounded/external/duplicate/spoofed data',()=>{
 const fonts=[...fontData].map(([family,src])=>({family,src}));assert.equal(A.validateFonts(fonts),fonts);
 for(const bad of [[{family:'Unknown',src:fonts[0].src}],[fonts[0],fonts[0]],[{...fonts[0],src:'https://example.com/font.woff2'}],[{...fonts[0],src:fonts[0].src.replace('font/woff2','image/png')}],[{...fonts[0],src:'data:font/woff2;base64,'+Buffer.alloc(100).toString('base64')}],[{...fonts[0],src:fonts[0].src+'%'}],[{...fonts[0],src:'data:font/woff2;base64,'+'A'.repeat(17*1024*1024)}]])assert.throws(()=>A.validateFonts(bad),/字体/);
 const payload=Buffer.alloc(11*1024*1024);payload.write('wOF2');const large=fonts.map(f=>({...f,src:'data:font/woff2;base64,'+payload.toString('base64')}));assert.throws(()=>A.validateFonts(large),/总量/);
});
function harness(licenses=fontLicenses){const active=new Set();let fail=false,clears=0;class Face{constructor(family,src,opts){Object.assign(this,{family,src,opts});}async load(){if(fail)throw Error('invalid font');return this;}}const context={document:{fonts:{add:f=>active.add(f),delete:f=>active.delete(f)}},FontFace:Face,ZTH_ALGORITHMS:A,ZTH_FONT_LICENSES:licenses,zthDesktop:{font:async family=>fontData.get(family)},fabric:{cache:{clearFontCache:()=>clears++}},console,atob};context.window=context;vm.runInNewContext(fs.readFileSync('app/fonts.js','utf8'),context);return {api:context.ZTH_FONTS,active,context,fail:value=>fail=value,clears:()=>clears};}
test('used-font embedding finds group/style fonts, excludes unused/system fonts, and stays synchronous',async()=>{
 const {api,active}=harness();await api.ready;assert.equal(active.size,4);
 assert.deepEqual(Array.from(api.collectUsed([{canvas:{objects:[]}}])),[]);
 const pages=[{canvas:{objects:[{type:'Group',objects:[{type:'Textbox',fontFamily:'Ma Shan Zheng',text:'造物'}]},{type:'Text',fontFamily:'Arial',styles:{0:{0:{fontFamily:'Roboto Mono'}}}},{type:'Textbox',text:'默认字'}]}}];
 const used=api.collectUsed(pages);assert.equal(typeof used.then,'undefined');assert.deepEqual(Array.from(used,f=>f.family),['ZTH Sans','Ma Shan Zheng','Roboto Mono']);assert.ok(used.every(f=>f.src===fontData.get(f.family)));assert.match(api.svgCSS(pages),/font-weight:100 700/);assert.ok(!api.svgCSS(pages).includes('ZCOOL XiaoWei'));const copy=api.list();copy[0].family='changed';assert.equal(api.list()[0].family,'ZTH Sans');
});
test('embedded project fonts load before use, roll back on failure and reset between projects',async()=>{
 const h=harness(),{api}=h;await api.ready;const pages=[{canvas:{objects:[{type:'Textbox',fontFamily:'ZTH Sans'}]}}];
 await api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('Roboto Mono')}]);assert.equal(api.collectUsed(pages)[0].src,fontData.get('Roboto Mono'));assert.equal(h.active.size,4);
 h.fail(true);await assert.rejects(api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('Ma Shan Zheng')}]),/invalid font/);assert.equal(api.collectUsed(pages)[0].src,fontData.get('Roboto Mono'));assert.equal(h.active.size,4);
 h.fail(false);await api.loadEmbedded([]);assert.equal(api.collectUsed(pages)[0].src,fontData.get('ZTH Sans'));assert.equal(h.active.size,4);assert.equal(h.clears(),2);
});

function parsedStyle(css){
 const {JSDOM}=require('jsdom'),dom=new JSDOM('');
 try{const doc=new dom.window.DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg"><defs><style>'+css+'</style></defs><text>Licensed text</text></svg>','image/svg+xml');
  assert.equal(doc.getElementsByTagName('parsererror').length,0,'font license must not break XML');
  assert.equal(doc.getElementsByTagName('script').length,0);assert.equal(doc.getElementsByTagName('style').length,1);
  const text=doc.getElementsByTagName('style')[0].textContent;
  const rules=require('rrweb-cssom').parse(text).cssRules;
  return {text,rules};
 }finally{dom.window.close();}
}

test('every used bundled font exports its complete original notice in portable JSON and valid SVG CSS',async()=>{
 const {api}=harness();await api.ready;
 const pages=[{width:100,height:100,canvas:{objects:[...fontData.keys()].map(fontFamily=>({type:'Textbox',fontFamily,text:'Text'}))}}];
 const project=JSON.parse(JSON.stringify({format:'zthpmsj',schema:1,pages,fonts:api.collectUsed(pages)}));
 A.validateProject(project);assert.equal(project.fonts.length,4);
 const {text,rules}=parsedStyle(api.svgCSS(pages));assert.equal(rules.length,4);
 for(const font of project.fonts){assert.equal(font.license,fontLicenses[font.family]);assert.ok(text.includes(font.license),font.family+' full original OFL text');}
 assert.ok(Array.from(rules).every(rule=>rule.type===5),'only font-face rules follow the notice comments');
});

test('old matching bytes inherit their original license but unrelated imported bytes never do',async()=>{
 const {api}=harness();await api.ready;const pages=[{canvas:{objects:[{type:'Textbox',fontFamily:'ZTH Sans'}]}}];
 await api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('ZTH Sans')}]);assert.equal(api.collectUsed(pages)[0].license,fontLicenses['ZTH Sans']);
 await api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('ZTH Sans'),license:'incorrect replacement notice'}]);assert.equal(api.collectUsed(pages)[0].license,fontLicenses['ZTH Sans']);
 await api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('Roboto Mono')}]);assert.equal(Object.hasOwn(api.collectUsed(pages)[0],'license'),false);
 const license='Copyright Example — permission & conditions\n-- preserved punctuation --\n</style><script>bad()</script>\n*/ @import url(https://invalid.example/); /*';
 await api.loadEmbedded([{family:'ZTH Sans',src:fontData.get('Roboto Mono'),license}]);assert.equal(api.collectUsed(pages)[0].license,license,'JSON keeps the exact supplied notice');
 const {text,rules}=parsedStyle(api.svgCSS(pages));assert.equal(rules.length,1);assert.equal(rules[0].type,5);assert.ok(text.includes('permission & conditions'));assert.ok(!text.includes('*/ @import'));
 await api.loadEmbedded([]);assert.equal(api.collectUsed(pages)[0].license,fontLicenses['ZTH Sans']);
});

test('invalid or unbounded imported license data is rejected without replacing active fonts',async()=>{
 const {api}=harness();await api.ready;const pages=[{canvas:{objects:[{type:'Textbox',fontFamily:'ZTH Sans'}]}}];
 const imported={family:'ZTH Sans',src:fontData.get('Roboto Mono'),license:'Valid imported notice'};
 await api.loadEmbedded([imported]);
 for(const license of [{},null,42,'x'.repeat(65537),'invalid\0notice','invalid\ud800notice','invalid\ufffenotice']){
  await assert.rejects(api.loadEmbedded([{...imported,license}]),/许可/);assert.equal(api.collectUsed(pages)[0].license,imported.license);
 }
 await api.loadEmbedded([{...imported,license:'Valid supplementary character: \u{1f4c4}'}]);assert.match(api.collectUsed(pages)[0].license,/📄/);
 const missing=harness({});await assert.rejects(missing.api.ready,/原始许可缺失/);assert.equal(missing.active.size,0);
});
