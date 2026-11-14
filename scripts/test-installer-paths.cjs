// Exercise the production path checks with isolated fixtures, no installer UI or registry writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
(async()=>{
 if(process.platform!=='win32')throw Error('This native NSIS check requires Windows.');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zth-path-regression-')),build=path.join(root,'build');fs.mkdirSync(build);
 let policy=fs.readFileSync('build/installer-policy.nsh','utf8');
 // Only UI/termination are adapted. Predicates, normalization and ancestor traversal stay production code.
 policy=policy.replace(/^\s*MessageBox[^\r\n]*$/gm,' ; UI suppressed in native fixture').replace(/^\s*Abort\s*$/gm,' SetErrorLevel 42\n Quit');
 // A mock installation has no registered predecessor; do not consult a real installation's registry.
 policy=policy.replace('ReadRegStr $OldInstallDir HKCU "Software\\ZeroToHand\\DesignStudio" "InstallDir"',"StrCpy $OldInstallDir ''");
 fs.writeFileSync(path.join(build,'installer-policy.nsh'),policy);
 for(const file of ['validate-directories.nsh','rollback-files.nsh'])fs.writeFileSync(path.join(build,file),'');
 const existing=path.join(root,'现存 中文 空格');fs.mkdirSync(existing);
 const fileAncestor=path.join(root,'file-ancestor');fs.writeFileSync(fileAncestor,'fixture');
 const junctionTarget=path.join(root,'junction-target'),junction=path.join(root,'junction');fs.mkdirSync(junctionTarget);fs.symlinkSync(junctionTarget,junction,'junction');
 const escape=value=>value.replaceAll('$','$$').replaceAll('"','$\\"');
 const scenarios=[
  {name:'existing-unicode-spaces',input:existing,expected:existing,allow:true},
  {name:'nonexistent-ascii-deep',input:path.join(root,'missing-ascii','nested','Studio'),allow:true,missing:true},
  {name:'nonexistent-unicode-spaces-deep',input:path.join(root,'尚不存在','安装 测试','ZTH Design Studio'),allow:true,missing:true},
  {name:'nonexistent-normalized-parent',input:root+'\\missing\\..\\规范 新目录\\Studio',expected:path.join(root,'规范 新目录','Studio'),allow:true,missing:true},
  {name:'drive-root',expression:'$WINDIR\\..\\',allow:false},
  {name:'windows-directory',expression:'$WINDIR',allow:false},
  {name:'windows-nonexistent-child',expression:'$WINDIR\\ZTH-fixture-missing',allow:false},
  {name:'normalized-system-directory',expression:'$WINDIR\\..\\Windows\\ZTH-fixture-missing',allow:false},
  {name:'short-name-system-directory',prelude:'GetFullPathName /SHORT $7 "$PROGRAMFILES"',expression:'$7\\ZTH-fixture-missing',allow:false,checkOnly:true},
  {name:'short-name-existing-system-root',prelude:'GetFullPathName /SHORT $7 "$PROGRAMFILES"',expression:'$7',allow:false,checkOnly:true},
  {name:'profile-root',expression:'$PROFILE',allow:false},
  {name:'temp-root',expression:'$TEMP',allow:false},
  {name:'existing-file-ancestor',input:path.join(fileAncestor,'Studio'),allow:false},
  {name:'junction-ancestor',input:path.join(junction,'Studio'),allow:false},
  {name:'unc-path',input:'\\\\localhost\\not-a-real-share\\Studio',allow:false},
  {name:'relative-path',input:'relative\\Studio',allow:false},
  {name:'trailing-space-normalized',input:path.join(root,'Studio '),expected:path.join(root,'Studio'),allow:true,missing:true},
  {name:'trailing-dot-rejected',input:path.join(root,'Studio.'),allow:false,missing:true},
  {name:'overlong-path',input:root+'\\'+('x'.repeat(221)),allow:false}
 ];
 const nsis=await require('app-builder-lib/out/toolsets/windows.js').getMakeNsisPath('0.0.0'),results=[];
 for(const scenario of scenarios){
  const output=path.join(root,scenario.name+'.txt'),expected=scenario.expected||scenario.input;
  if(scenario.missing)assert.equal(fs.existsSync(expected),false);
  const script=String.raw`Unicode true
Name "ZTH isolated path regression"
OutFile "../${scenario.name}.exe"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
!include "LogicLib.nsh"
!include "installer-policy.nsh"
Section
 SetShellVarContext current
 ${scenario.prelude||''}
 StrCpy $INSTDIR "${scenario.expression||escape(scenario.input)}"
 Call ${scenario.checkOnly?'CheckPath':'CheckInstallFolder'}
 FileOpen $0 "${output}" w
 FileWriteUTF16LE /BOM $0 "$INSTDIR"
 FileClose $0
 SetErrorLevel 0
SectionEnd
`;
  fs.writeFileSync(path.join(build,scenario.name+'.nsi'),script);
  const compile=spawnSync(nsis.path,['-INPUTCHARSET','UTF8',scenario.name+'.nsi'],{cwd:build,env:{...process.env,...nsis.env},encoding:'utf8',windowsHide:true});if(compile.status!==0)throw Error(compile.stdout+compile.stderr);
  const run=spawnSync(path.join(root,scenario.name+'.exe'),[],{windowsHide:true,timeout:10000});if(run.error)throw run.error;
  const accepted=run.status===0;if(!accepted)assert.equal(run.status,42,'Fixture must reject via the production policy');
  const normalized=accepted?fs.readFileSync(output,'utf16le').replace(/^\uFEFF/,''):null;
  if(accepted&&expected)assert.equal(normalized.toLowerCase(),expected.toLowerCase());
  const targetNotCreated=scenario.missing?!fs.existsSync(expected):undefined;
  if(scenario.missing)assert.equal(targetNotCreated,true,'Path validation must not create the target');
  results.push({name:scenario.name,expectedAllowed:scenario.allow,accepted,matched:accepted===scenario.allow,...(scenario.missing?{targetNotCreated}:{})});
 }
 const report={ok:results.every(result=>result.matched),test:'Production NSIS path normalization, ancestor checks and writable-parent probe with isolated fixtures',guiFlowTested:false,realInstallationTouched:false,registryWrites:false,scenarios:results};
 if(!process.argv.includes('--observe'))fs.writeFileSync('qa/installer-paths-v4.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
