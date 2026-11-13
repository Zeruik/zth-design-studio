const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),asar=require('@electron/asar');
const {verifyWindowsPayload}=require('../scripts/verify-windows-payload.cjs');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'zth-asar-validation-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const source=path.join(root,'source'),archive=path.join(root,'app.asar');
 await fs.mkdir(path.join(source,'app/legal'),{recursive:true});await fs.mkdir(path.join(source,'desktop'));
 const entries={'package.json':'{"version":"4.0.0"}','app/index.html':'<html>4.0</html>','app/legal/TERMS.txt':'条款第一版','app/legal-data.js':'window.TERMS="first";','desktop/main.cjs':'// native first'};
 for(const [file,content] of Object.entries(entries))await fs.writeFile(path.join(source,file),content);
 await asar.createPackageFromFiles(source,archive,['app','app/legal','desktop',...Object.keys(entries)].map(file=>path.join(source,file)));return {source,archive};
}
test('installer-only accepts an ASAR whose complete app and desktop payload matches source',async t=>{
 const {source,archive}=await fixture(t);assert.equal(verifyWindowsPayload(archive,source),4);
});
test('installer-only rejects changed legal text or desktop code even when the package version is unchanged',async t=>{
 const {source,archive}=await fixture(t);await fs.writeFile(path.join(source,'app/legal/TERMS.txt'),'条款第二版');
 assert.throws(()=>verifyWindowsPayload(archive,source),error=>/changed app\/legal\/TERMS.txt/.test(error.message)&&/完整重建/.test(error.message));
 await fs.writeFile(path.join(source,'app/legal/TERMS.txt'),'条款第一版');await fs.writeFile(path.join(source,'desktop/main.cjs'),'// native second');
 assert.throws(()=>verifyWindowsPayload(archive,source),/changed desktop\/main.cjs/);
});
test('installer-only rejects both newly added files absent from ASAR and obsolete files still inside it',async t=>{
 const {source,archive}=await fixture(t);await fs.writeFile(path.join(source,'app/legal/PRIVACY.txt'),'privacy');await fs.unlink(path.join(source,'app/legal-data.js'));
 assert.throws(()=>verifyWindowsPayload(archive,source),error=>/missing app\/legal\/PRIVACY.txt/.test(error.message)&&/obsolete app\/legal-data.js/.test(error.message));
});
