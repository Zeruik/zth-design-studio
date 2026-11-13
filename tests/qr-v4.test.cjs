'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
let canvas,decode;
try{canvas=require('canvas');canvas.createCanvas(1,1);}catch{canvas=null;}
try{decode=require('jsqr');}catch{try{decode=require('../.tools/qa/node_modules/jsqr');}catch{decode=null;}}
const samples=[
 {text:'https://github.com/Zeruik/zth-design-studio',colors:{}},
 {text:'ZTH 4.0｜把想法，做成真的。\n欢迎参加工作室开放日。',colors:{dark:'#5b287d',light:'#fff4db'}},
 {text:'ZTH DESIGN STUDIO / '+Array.from({length:25},(_,i)=>'STEP '+i+': DESIGN BUILD SHARE').join(' / '),colors:{dark:'#172d54',light:'#ffffff'}}
];

test('actual bundled QR PNGs preserve four-module quiet zones and every encoded module',{
 skip:!canvas&&'Native canvas is unavailable; actual PNG pixel checks require the optional Fabric canvas dependency'
},async t=>{
 const previousDocument=global.document;
 // Execute the shipped browser encoder using a real raster canvas. No encoder
 // methods, pixel data or exported image bytes are mocked.
 global.document={createElement:tag=>{assert.equal(tag,'canvas');return canvas.createCanvas(1,1);}};
 try{
  const {default:QRCode}=await import(pathToFileURL(path.join(__dirname,'../app/vendor/qrcode.mjs')).href);
  const source=fs.readFileSync(path.join(__dirname,'../app/qr.js'),'utf8');
  const body=source.replace(/^import QRCode from ['"]\.\/vendor\/qrcode\.mjs['"];?\s*/,'');
  assert.notEqual(body,source,'the harness must retain and execute the actual makeQR implementation');
  const context=vm.createContext({QRCode,window:{}});vm.runInContext(body,context,{filename:'app/qr.js'});
  if(!decode)t.diagnostic('No independent decoder installed; quiet-zone pixels and every QR module are checked without adding dependencies.');
  for(const sample of samples){
   const url=await context.window.makeQR(sample.text,sample.colors);assert.match(url,/^data:image\/png;base64,/);
   const image=await canvas.loadImage(url),target=canvas.createCanvas(image.width,image.height),ctx=target.getContext('2d');ctx.drawImage(image,0,0);
   assert.equal(image.width,700);assert.equal(image.height,700);
   const pixels=ctx.getImageData(0,0,image.width,image.height).data;
   const rgba=hex=>[...hex.replace('#','').match(/../g).map(x=>parseInt(x,16)),255];
   const dark=rgba(sample.colors.dark||'#142c4a'),light=rgba(sample.colors.light||'#ffffff');
   const qr=QRCode.create(sample.text,{errorCorrectionLevel:'M'}),n=qr.modules.size,scale=image.width/(n+8),margin=4*scale;
   const pixel=(x,y)=>Array.from(pixels.slice((y*image.width+x)*4,(y*image.width+x)*4+4));
   const is=(x,y,color)=>color.every((v,i)=>pixels[(y*image.width+x)*4+i]===v);
   let minX=image.width,minY=image.height,maxX=-1,maxY=-1,darkPixels=0;
   for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
    const ink=is(x,y,dark);assert.ok(ink||is(x,y,light),'PNG must contain only the requested solid foreground/background colors');
    if(ink){darkPixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    // A 700px output can divide into fractional module sizes. Test all complete
    // margin pixels; the trailing side can round down by less than one pixel.
    if(x<Math.floor(margin)||y<Math.floor(margin)||x>=image.width-Math.floor(margin)||y>=image.height-Math.floor(margin))assert.ok(!ink,'quiet zone contains an ink pixel');
   }
   assert.ok(darkPixels>n*n,'the output must contain a real symbol, not only blank margins');
   for(const border of [minX,minY,image.width-1-maxX,image.height-1-maxY])assert.ok(border>=Math.floor(margin),`quiet zone ${border}px is shorter than four rasterized modules (${margin}px)`);
   // Compare every module center, including finders, format data and payload.
   // This checks that adding the border shifts/scales the symbol without crop.
   for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    const x=Math.floor(margin+(col+.5)*scale),y=Math.floor(margin+(row+.5)*scale);
    assert.deepEqual(pixel(x,y),qr.modules.get(row,col)?dark:light,`module ${row},${col} changed in rendered QR`);
   }
   if(decode){const result=decode(new Uint8ClampedArray(pixels),image.width,image.height,{inversionAttempts:'dontInvert'});assert.ok(result,'existing jsQR decoder must find the actual generated image');assert.equal(result.data,sample.text,'decoded payload must be unchanged');}
  }
 }finally{if(previousDocument===undefined)delete global.document;else global.document=previousDocument;}
});
