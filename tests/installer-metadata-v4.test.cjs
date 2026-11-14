const {test}=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
test('native NSIS upgrades a v3 fixture and reports metadata failures without losing old files',{skip:process.platform!=='win32'},()=>{
 const result=spawnSync(process.execPath,['scripts/test-installer-upgrade.cjs'],{encoding:'utf8',windowsHide:true,timeout:60000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.equal(JSON.parse(result.stdout).ok,true);
});
