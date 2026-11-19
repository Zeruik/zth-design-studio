'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const canonical=require('../scripts/canonical-fixture-path.cjs');
test('fixture path comparisons resolve ancestor aliases without creating missing installation directories',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zth-fixture-path-'));
 try{
  const real=path.join(root,'real parent'),alias=path.join(root,'alias');fs.mkdirSync(real);fs.symlinkSync(real,alias,process.platform==='win32'?'junction':'dir');
  const suffix=path.join('尚未创建','Studio');assert.equal(canonical(path.join(alias,suffix)),canonical(path.join(real,suffix)));assert.equal(fs.existsSync(path.join(real,suffix)),false);
  assert.notEqual(canonical(path.join(real,suffix)),canonical(path.join(root,'other',suffix)),'different installation targets must still fail comparison');
  fs.writeFileSync(path.join(real,'file'),'fixture');assert.equal(canonical(path.join(alias,'file')),canonical(path.join(real,'file')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
