/* Original brand artwork is preserved on disk. Transparent variants are created
   locally from those pixels, cached, and embedded in exported project files. */
(function(root){
'use strict';
const assets=[
 {file:'01-81899.png',name:'赋形造物 · 白色横版',mode:'light',contrast:'dark'},
 {file:'02-81900.png',name:'赋形造物 · 黑色横版',mode:'dark',contrast:'light'},
 {file:'03-81893.png',name:'赋形造物 · 黑色竖版',mode:'dark',contrast:'light'},
 {file:'04-81895.png',name:'赋形造物 · 白色竖版',mode:'light',contrast:'dark'},
 {file:'05-81892.png',name:'赋形造物 · 白色独立标识',mode:'light',contrast:'dark'},
 {file:'06-81867.png',name:'向阳 / 图学 / 模型 · 组合',mode:'color',contrast:'light'},
 {file:'07-81868.png',name:'三社团联名 · 横版',mode:'color',contrast:'light'}
];
const byFile=new Map(assets.map(a=>[a.file,a])),cache=new Map();
const key=src=>typeof src==='string'?src.split('/').pop():'';
const clamp=v=>Math.min(255,Math.max(0,Math.round(v)));
function processPixels(input,width,height,mode){
 if(input.length!==width*height*4)throw Error('Invalid brand image dimensions');
 const out=new Uint8ClampedArray(input);
 for(let i=0;i<out.length;i+=4){
  const r=input[i],g=input[i+1],b=input[i+2];
  const light=(r+g+b)/3;
  if(mode==='light'||mode==='dark'){
   // The five monochrome marks have known ink and paper colors. Converting the
   // matte to alpha also preserves counters inside letters and avoids halos.
   const coverage=mode==='light'?light:255-light;
   out[i]=out[i+1]=out[i+2]=mode==='light'?255:0;
   out[i+3]=clamp(input[i+3]*Math.max(0,(coverage-8)/247));
   continue;
  }
  const lo=Math.min(r,g,b),hi=Math.max(r,g,b),chroma=hi-lo;
  if(lo>=245){out[i+3]=0;continue;}
  if(chroma<=12){
   // Black lettering uses the same white-matte extraction as the black marks.
   out[i]=out[i+1]=out[i+2]=0;
   out[i+3]=clamp(input[i+3]*Math.max(0,(255-light-8)/247));
   continue;
  }
  if(lo<195)continue; // Keep the original saturated logo colors fully intact.
  const alpha=Math.min(1,Math.max(0,(245-lo)/50));
  out[i+3]=clamp(input[i+3]*alpha);
  if(alpha>0){
   // Remove the white matte from the narrow antialias fringe, not the artwork.
   out[i]=clamp((r-255*(1-alpha))/alpha);
   out[i+1]=clamp((g-255*(1-alpha))/alpha);
   out[i+2]=clamp((b-255*(1-alpha))/alpha);
  }
 }
 return out;
}
function isBrand(src){return byFile.has(key(src));}
async function get(src){
 const file=key(src),asset=byFile.get(file);
 if(!asset)return src;
 if(!cache.has(file))cache.set(file,(async()=>{
  const img=new Image();img.src='assets/'+file;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height);
  data.data.set(processPixels(data.data,canvas.width,canvas.height,asset.mode));
  ctx.putImageData(data,0,0);return canvas.toDataURL('image/png');
 })().catch(err=>{cache.delete(file);throw err;}));
 return cache.get(file);
}
root.ZTH_BRAND={get,isBrand,processPixels,list:()=>assets.map(a=>({...a,src:'assets/'+a.file}))};
if(typeof module!=='undefined')module.exports=root.ZTH_BRAND;
})(typeof window==='undefined'?globalThis:window);
