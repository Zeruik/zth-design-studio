const {test}=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
test('native NSIS upgrades a v3 fixture and reports metadata failures without losing old files',{skip:process.platform!=='win32'},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zth-installer-report-')),file=path.join(root,'result.json'),runId=crypto.randomUUID();
 try{
  const result=spawnSync(process.execPath,['scripts/test-installer-upgrade.cjs','--report',file,'--run-id',runId],{encoding:'utf8',windowsHide:true,timeout:60000});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  const report=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(report.runId,runId);assert.equal(report.ok,true);assert.equal(report.realInstallationTouched,false);assert.equal(report.scenarios.length,5);assert.ok(report.scenarios.every(s=>s.passed));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
