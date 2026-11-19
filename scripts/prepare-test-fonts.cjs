'use strict';
// Native Canvas cannot load the WOFF2 files used by the browser. Fetch the
// corresponding, already-audited TTF and verify its recorded source digest.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),font=require('../app/assets/fonts/SOURCES.json').fonts.find(f=>f.family==='Ma Shan Zheng');
const directory=path.join(root,'.tools','test-fonts'),file=path.join(directory,'MaShanZheng.ttf');
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if(!font||!font.source.startsWith('https://raw.githubusercontent.com/google/fonts/')||!/^[a-f0-9]{64}$/.test(font.sourceSha256))throw Error('Invalid audited test font source');
fs.mkdirSync(directory,{recursive:true});
if(!fs.existsSync(file)){
 const temporary=file+'.'+crypto.randomUUID()+'.tmp';
 try{
  execFileSync('curl',['--fail','--location','--proto','=https','--tlsv1.2','--connect-timeout','20','--max-time','90','--max-filesize','16777216','--output',temporary,font.source],{stdio:'inherit'});
  if(digest(temporary)!==font.sourceSha256)throw Error('Test font source checksum mismatch');
  fs.renameSync(temporary,file);
 }finally{fs.rmSync(temporary,{force:true});}
}
if(digest(file)!==font.sourceSha256)throw Error('Cached test font checksum mismatch');
console.log('Verified native Canvas test font: '+font.family);
