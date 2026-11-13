const fs=require('node:fs'),path=require('node:path'),asar=require('@electron/asar');

function verifyWindowsPayload(archive,root){
 const expected=new Map(),actual=new Map(),issues=[];
 function walk(directory){
  for(const entry of fs.readdirSync(path.join(root,directory),{withFileTypes:true})){
   const relative=directory+'/'+entry.name;
   if(entry.isDirectory())walk(relative);
   else if(entry.isFile())expected.set(relative,fs.readFileSync(path.join(root,relative)));
   else throw Error('Unsupported source entry: '+relative);
  }
 }
 try{
  walk('app');walk('desktop');
  for(const entry of asar.listPackage(archive)){
   const relative=entry.replaceAll('\\','/').replace(/^\/+/, '');
   if(!relative.startsWith('app/')&&!relative.startsWith('desktop/'))continue;
   const stat=asar.statFile(archive,path.normalize(relative),false);
   if(!('files' in stat))actual.set(relative,stat);
  }
  for(const [relative,bytes] of expected){
   if(!actual.has(relative))issues.push('missing '+relative);
   else if('link' in actual.get(relative)||!asar.extractFile(archive,path.normalize(relative),false).equals(bytes))issues.push('changed '+relative);
  }
  for(const relative of actual.keys())if(!expected.has(relative))issues.push('obsolete '+relative);
  if(issues.length)throw Error(issues.slice(0,12).join('\n')+(issues.length>12?'\n… '+(issues.length-12)+' more differences':''));
 }catch(error){
  throw Error('Cannot use --installer-only: the packaged app does not match current app/ and desktop/ files.\n'+error.message+'\n请完整重建：node scripts/build-windows.cjs（不要使用 --installer-only）。');
 }
 return expected.size;
}
module.exports={verifyWindowsPayload};
