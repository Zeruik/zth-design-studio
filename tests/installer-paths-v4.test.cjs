const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
test('Native installer allows new Unicode folders and rejects unsafe ancestors',{skip:process.platform!=='win32'},()=>{
 const result=spawnSync(process.execPath,['scripts/test-installer-paths.cjs'],{encoding:'utf8',windowsHide:true,timeout:60000});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
