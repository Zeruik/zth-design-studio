'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {profileDirectory}=require('../desktop/profile-directory.cjs');
test('explicit native profiles stay separate and reject relative, root, duplicate and linked paths',()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'zth-design-profile-'));
 try{
  assert.equal(profileDirectory(['app.exe']),null);assert.deepEqual(fs.readdirSync(base),[]);
  const chosen=path.join(base,'Separate Profile');assert.equal(profileDirectory(['--zth-profile-dir='+chosen]),chosen);assert.ok(fs.statSync(chosen).isDirectory());
  assert.throws(()=>profileDirectory(['--zth-profile-dir=relative']),/ABSOLUTE/);assert.throws(()=>profileDirectory(['--zth-profile-dir='+path.parse(base).root]),/ROOT/);assert.throws(()=>profileDirectory(['--zth-profile-dir='+chosen,'--zth-profile-dir='+chosen]),/ARGUMENT/);
  const link=path.join(base,'Linked');fs.symlinkSync(chosen,link,process.platform==='win32'?'junction':'dir');assert.throws(()=>profileDirectory(['--zth-profile-dir='+path.join(link,'child')]),/LINK/);assert.equal(fs.existsSync(path.join(chosen,'child')),false);
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
