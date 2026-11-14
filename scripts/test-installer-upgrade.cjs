// Native regression fixtures only: no real installation, registry writes or UI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
(async()=>{
 if(process.platform!=='win32')throw Error('This NSIS regression requires Windows.');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zth-upgrade-regression-')),build=path.join(root,'build'),payloadRoot=path.join(root,'release/win-unpacked');
 fs.mkdirSync(build,{recursive:true});fs.mkdirSync(path.join(payloadRoot,'resources'),{recursive:true});
 const payloadFiles={'LICENSE.electron.txt':'new license','ZTH Design Studio.exe':'new mock executable','resources/app.asar':'new mock archive'};
 for(const[file,bytes]of Object.entries(payloadFiles))fs.writeFileSync(path.join(payloadRoot,file),bytes);
 fs.writeFileSync(path.join(payloadRoot,'debug.log'),'fixture runtime log, must never ship');
 fs.writeFileSync(path.join(payloadRoot,'resources/debug.log'),'nested fixture runtime log, must never ship');
 fs.writeFileSync(path.join(build,'icon.ico'),'new mock icon');
 for(const file of ['installer-policy.nsh','installer-metadata.nsh'])fs.copyFileSync(path.join('build',file),path.join(build,file));
 const manifest=require('./installer-manifest.cjs').manifest(payloadRoot);
 for(const[name,key]of[['install-files','install'],['rollback-files','rollback'],['uninstall-files','uninstall'],['uninstall-directories','removeDirectories'],['validate-directories','validateDirectories']])fs.writeFileSync(path.join(build,name+'.nsh'),manifest[key]);
 const installer=fs.readFileSync('build/installer.nsi','utf8'),start='Section "ZTH Design Studio"',end=' ReadRegStr $0 HKCU "Software\\ZeroToHand\\DesignStudio" "AssociationBackupSaved"';
 assert.equal(installer.split(start).length,2);assert.equal(installer.split(end).length,2);
 const productionSection=installer.split(start)[1].split(end)[0].replace(' Call CheckInstallFolder',' Call CheckPath\n Call CheckNotRunning');
 const nsis=await require('app-builder-lib/out/toolsets/windows.js').getMakeNsisPath('0.0.0');
 const scenarios=[];
 for(const name of ['success','marker-open-failure','uninstaller-failure','missing-payload','runtime-log-cleanup']){
  const target=path.join(root,'cases',name,'升级 中文 空格');fs.mkdirSync(path.join(target,'resources'),{recursive:true});
  const originals={...Object.fromEntries(Object.entries(payloadFiles).map(([file,bytes])=>[file,'old '+bytes])),'icon.ico':'old icon','Uninstall.exe':'old uninstaller'};
  for(const[file,bytes]of Object.entries(originals))fs.writeFileSync(path.join(target,file),bytes);
  fs.writeFileSync(path.join(target,'sentinel.txt'),'keep unrelated file');
  let section=productionSection;
  if(name==='marker-open-failure')section=section.replace(' Call PrepareInstallMetadata',' CreateDirectory "$StageDir\\zth-install.ini"\n Call PrepareInstallMetadata');
  if(name==='uninstaller-failure')section=section.replace(' Call PrepareInstallMetadata',' CreateDirectory "$StageDir\\Uninstall.exe"\n Call PrepareInstallMetadata');
  if(name==='missing-payload')section=section.replace(' !include "install-files.nsh"',' Delete "$StageDir\\resources\\app.asar"\n !include "install-files.nsh"');
  const output=path.join(root,name+'.txt');
  const script=String.raw`Unicode true
Name "ZTH isolated installer regression"
OutFile "../${name}.exe"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
!include "LogicLib.nsh"
!define APP_VERSION "4.0.0"
!include "installer-policy.nsh"
!include "installer-metadata.nsh"
Var FlushSetsError
Var Result
Section
 StrCpy $INSTDIR "${target}"
 StrCpy $ChangedCount 0
 StrCpy $RollbackFailed 0
 WriteINIStr "$INSTDIR\flush-probe.ini" "probe" "key" "value"
 ClearErrors
 StrCpy $FlushSetsError 0
 FlushINI "$INSTDIR\flush-probe.ini"
 IfErrors 0 +2
 StrCpy $FlushSetsError 1
 ClearErrors
${section}
${name==='runtime-log-cleanup'?String.raw` FileOpen $0 "$INSTDIR\debug.log" w
 FileWrite $0 "fixture runtime log"
 FileClose $0
 !include "uninstall-files.nsh"`:''}
 StrCpy $Result "success"
 Goto done
 install_rollback:
 Call RollbackFiles
 install_failed:
 StrCpy $Result "failed"
 Call CleanupStaging
 done:
 FileOpen $7 "${output}" w
 FileWriteUTF16LE /BOM $7 "$Result|$InstallStep|$FlushSetsError|$RollbackFailed"
 FileClose $7
SectionEnd
Section Uninstall
SectionEnd
`;
  fs.writeFileSync(path.join(build,name+'.nsi'),script);
  const compile=spawnSync(nsis.path,['-INPUTCHARSET','UTF8',name+'.nsi'],{cwd:build,env:{...process.env,...nsis.env},encoding:'utf8'});
  if(compile.status!==0)throw Error(compile.stdout+compile.stderr);
  const listing=spawnSync(path.resolve('node_modules/electron-winstaller/vendor/7z.exe'),['l','-slt',path.join(root,name+'.exe')],{encoding:'utf8',windowsHide:true});
  assert.equal(listing.status,0);assert.doesNotMatch(listing.stdout,/^Path = .*debug\.log\r?$/im,'Runtime logs must not be embedded in the actual NSIS archive');
  const run=spawnSync(path.join(root,name+'.exe'),[],{windowsHide:true,timeout:15000});if(run.error)throw run.error;assert.equal(run.status,0);
  const[result,step,flushError,rollbackFailed]=fs.readFileSync(output,'utf16le').replace(/^\uFEFF/,'').split('|');
  assert.equal(flushError,'1','Fixture must reproduce the original FlushINI error flag');assert.equal(rollbackFailed,'0');
  assert.equal(fs.readFileSync(path.join(target,'sentinel.txt'),'utf8'),'keep unrelated file');
  if(name==='runtime-log-cleanup'){
   assert.equal(result,'success');assert.equal(fs.existsSync(path.join(target,'debug.log')),false);
   for(const file of Object.keys(payloadFiles))assert.equal(fs.existsSync(path.join(target,file)),false);
  }else if(name==='success'){
   assert.equal(result,'success');for(const[file,bytes]of Object.entries(payloadFiles))assert.equal(fs.readFileSync(path.join(target,file),'utf8'),bytes);
   const marker=fs.readFileSync(path.join(target,'zth-install.ini'),'utf16le');assert.match(marker,/Owner=studio\.zerotohand\.design/);assert.ok(marker.includes('InstallDir='+target));assert.match(marker,/Version=4\.0\.0/);assert.ok(fs.statSync(path.join(target,'Uninstall.exe')).size>1000);
  }else{
   assert.equal(result,'failed');for(const[file,bytes]of Object.entries(originals))assert.equal(fs.readFileSync(path.join(target,file),'utf8'),bytes);
   assert.equal(fs.existsSync(path.join(target,'zth-install.ini')),false);
   if(name==='marker-open-failure')assert.ok(step.includes('marker: open'));
   if(name==='uninstaller-failure')assert.ok(step.includes('create uninstaller'));
   if(name==='missing-payload')assert.ok(step.includes('replace: resources\\app.asar'));
  }
  assert.equal(fs.readdirSync(target).some(entry=>/^ns.*\.tmp$/i.test(entry)),false,'Own staging directories must be cleaned');
  scenarios.push({name,passed:true,originalFlushErrorReproduced:true,runtimeLogsExcludedFromArchive:true});
 }
 const report={ok:true,test:'Native NSIS production staging/metadata/commit code with mock payload only',realInstallationTouched:false,guiFlowTested:false,scenarios};
 fs.writeFileSync('qa/installer-upgrade-v4.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
