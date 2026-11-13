/* Offline, OFL-licensed typefaces. No network font service is used at runtime. */
(function(root){
'use strict';
const definitions=Object.freeze([
 {family:'ZTH Sans',label:'ZTH 黑体 · 内嵌',src:'assets/fonts/ZTHSans.woff2',weight:'100 900'},
 {family:'ZCOOL XiaoWei',label:'站酷小薇 · 中文艺术体',src:'assets/fonts/ZCOOLXiaoWei.woff2',weight:'400'},
 {family:'Ma Shan Zheng',label:'马善政 · 毛笔楷体',src:'assets/fonts/MaShanZheng.woff2',weight:'400'},
 {family:'Roboto Mono',label:'Roboto Mono · 英文等宽',src:'assets/fonts/RobotoMono.woff2',weight:'100 700'}
].map(Object.freeze));
const bundled=new Map(),embedded=new Map();let initialized=false;
const LICENSE_MAX_CHARS=64*1024;
function licenseText(value){
 if(value===undefined)return undefined;
 if(typeof value!=='string'||value.length>LICENSE_MAX_CHARS)throw Error('内嵌字体许可无效或超过 64 Ki 字符');
 for(const character of value){const point=character.codePointAt(0);if(!(point===9||point===10||point===13||(point>=32&&point<=0xd7ff)||(point>=0xe000&&point<=0xfffd)||(point>=0x10000&&point<=0x10ffff)))throw Error('内嵌字体许可含无效字符');}
 return value.trim()?value:undefined;
}
const list=()=>definitions.map(d=>({...d}));
const dataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).replace(/^data:[^;]+;/,'data:font/woff2;'));reader.onerror=()=>reject(reader.error||Error('字体读取失败'));reader.readAsDataURL(blob);});
async function loadFace(d,src){const face=new FontFace(d.family,'url('+src+')',{weight:d.weight});await face.load();return face;}
const ready=(async()=>{
 if(!root.document||!root.FontFace)return;
 const loaded=await Promise.all(definitions.map(async d=>{
  let src;if(root.zthDesktop)src=await root.zthDesktop.font(d.family);
  else{const response=await fetch(d.src);if(!response.ok)throw Error(d.label+'加载失败');src=await dataURL(await response.blob());}
  root.ZTH_ALGORITHMS.validateFonts([{family:d.family,src}]);
  const license=licenseText(root.ZTH_FONT_LICENSES?.[d.family]);
  if(!license)throw Error(d.label+'原始许可缺失，请检查应用文件');
  return {...d,data:src,license,face:await loadFace(d,src)};
 }));
 loaded.forEach(d=>{bundled.set(d.family,d);document.fonts.add(d.face);});initialized=true;
 return list();
})();
// Prevent an early boot rejection becoming unhandled; callers still receive the error.
ready.catch(()=>{});
function familiesUsed(pages){
 const used=new Set();
 function add(value){if(typeof value!=='string')return;for(const family of value.split(',').map(s=>s.trim().replace(/^['"]|['"]$/g,'')))if(definitions.some(d=>d.family===family))used.add(family);}
 function walk(value){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return;}
  if(typeof value.fontFamily==='string')add(value.fontFamily);
  else if(['text','i-text','textbox'].includes(String(value.type||value.kind).toLowerCase()))used.add('ZTH Sans');
  for(const [key,item]of Object.entries(value))if(key!=='src'&&key!=='fonts')walk(item);
 }
 walk(pages);return used;
}
function collectUsed(pages){
 const used=familiesUsed(pages);
 if(used.size&&!initialized)throw Error('内置字体尚未加载完成');
 return definitions.filter(d=>used.has(d.family)).map(d=>{const font=embedded.get(d.family)||bundled.get(d.family);return {family:d.family,src:font.data,...(font.license?{license:font.license}:{})};});
}
async function loadEmbedded(fonts=[]){
 await ready;root.ZTH_ALGORITHMS.validateFonts(fonts);
 // Load all data before changing the active set; malformed projects leave it intact.
 const loaded=await Promise.all(fonts.map(async f=>{const d=definitions.find(d=>d.family===f.family),local=bundled.get(f.family),sameBytes=f.src===local.data;
  // Only matching bytes inherit our bundled license. Different font versions
  // retain their own supplied notice; a family name is not proof of provenance.
  const license=sameBytes?local.license:licenseText(f.license);
  return {...d,data:f.src,license,face:sameBytes?local.face:await loadFace(d,f.src)};
 }));
 for(const f of embedded.values())document.fonts.delete(f.face);
 embedded.clear();for(const f of bundled.values())document.fonts.add(f.face);
 for(const f of loaded){document.fonts.delete(bundled.get(f.family).face);document.fonts.add(f.face);embedded.set(f.family,f);}
 // Fabric caches text widths by family; an imported font version can change metrics.
 root.fabric?.cache?.clearFontCache();
}
function svgCSS(pages){return collectUsed(pages).map(f=>{const d=definitions.find(d=>d.family===f.family);
 // This string is placed inside an SVG <style>. XML escaping keeps imported
 // notices from adding elements; escaping a CSS comment terminator also keeps
 // arbitrary notice text from becoming executable CSS. Bundled OFL notices do
 // not contain that delimiter, so their text remains unchanged after XML parse.
 const notice=f.license?'/* Font license: '+f.family+'\n'+f.license.replace(/\*\//g,'*\\/').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'\n*/\n':'';
 return notice+'@font-face{font-family:"'+f.family+'";font-weight:'+d.weight+';src:url("'+f.src+'") format("woff2");}';}).join('\n');}
root.ZTH_FONTS={ready,list,collectUsed,loadEmbedded,svgCSS,familiesUsed};
if(typeof module!=='undefined')module.exports=root.ZTH_FONTS;
})(typeof window==='undefined'?globalThis:window);
