// Run on Windows after npm ci. Uses isolated mock files, never the user installation.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
(async()=>{
 if(process.platform!=='win32')throw Error('This native NSIS check requires Windows.');
 const testRoot=fs.mkdtempSync(path.resolve('.tools/installer-policy-check-')),build=path.join(testRoot,'build'),payloadRoot=path.join(testRoot,'payload'),target=path.join(build,'native-policy-test');
 fs.mkdirSync(build,{recursive:true});fs.mkdirSync(path.join(payloadRoot,'resources'),{recursive:true});
 fs.writeFileSync(path.join(payloadRoot,'ZTH Design Studio.exe'),'Mock payload, not an application');fs.writeFileSync(path.join(payloadRoot,'resources/app.asar'),'Mock payload');
 fs.copyFileSync('build/installer-policy.nsh',path.join(build,'installer-policy.nsh'));
 const payload=require('./installer-manifest.cjs').manifest(payloadRoot);
 for(const[name,key]of[['install-files','install'],['rollback-files','rollback'],['uninstall-files','uninstall'],['uninstall-directories','removeDirectories'],['validate-directories','validateDirectories']])fs.writeFileSync(path.join(build,name+'.nsh'),payload[key]);
 const files=['ZTH Design Studio.exe','resources\\app.asar','icon.ico','zth-install.ini','Uninstall.exe'];
 const oldFiles=files.map((f,i)=>`FileOpen $0 "$INSTDIR\\${f}" w\nFileWrite $0 "old-${i}"\nFileClose $0`).join('\n');
 const newFiles=files.slice(0,2).map((f,i)=>`FileOpen $0 "$StageDir\\${f}" w\nFileWrite $0 "new-${i}"\nFileClose $0`).join('\n');
 const deleteShortcutTest=fs.readFileSync('build/installer-policy.nsh','utf8').match(/Function un\.DeleteOwnedShortcut[\s\S]*?FunctionEnd/)[0].replace('Function un.DeleteOwnedShortcut','Function TestDeleteOwnedShortcut').replace('Call un.GetShortcutTarget','Call GetShortcutTarget');
 const script=String.raw`Unicode true
Name "ZTH Installer Policy Unit Test"
OutFile "../policy-tests.exe"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
!include "LogicLib.nsh"
!include "installer-policy.nsh"
${deleteShortcutTest}
Section
 StrCpy $INSTDIR "${target}"
 CreateDirectory "$INSTDIR\resources"
 Call CheckPath
 Call AcquireSetupMutex
 FileOpen $0 "$INSTDIR\mutex-handle.txt" w
 FileWrite $0 "$SetupMutex"
 FileClose $0
 System::Call 'kernel32::CloseHandle(p $SetupMutex)'
 FileOpen $0 "$INSTDIR\ownership-unicode.ini" w
 FileWriteUTF16LE /BOM $0 "[ZTH]$\r$\n"
 FileClose $0
 WriteINIStr "$INSTDIR\ownership-unicode.ini" "ZTH" "InstallDir" "$INSTDIR"
 ReadINIStr $2 "$INSTDIR\ownership-unicode.ini" "ZTH" "InstallDir"
 FileOpen $0 "$INSTDIR\ownership-path.txt" w
 FileWriteUTF16LE $0 "$2"
 FileClose $0
 StrCpy $StageDir "$INSTDIR\stage"
 StrCpy $BackupDir "$INSTDIR\backup"
 CreateDirectory "$StageDir\resources"
 CreateDirectory "$BackupDir\resources"
 ${oldFiles}
 FileOpen $0 "$INSTDIR\unrelated-sentinel.txt" w
 FileWrite $0 "keep-user-file"
 FileClose $0
 ${newFiles}
 StrCpy $ShortcutPath "$INSTDIR\Owned shortcut.lnk"
 StrCpy $ExpectedTarget "$INSTDIR\ZTH Design Studio.exe"
 Call CreateOwnedShortcut
 Call GetShortcutTarget
 FileOpen $0 "$INSTDIR\shortcut-target.txt" w
 FileWriteUTF16LE $0 "$ShortcutTarget"
 FileClose $0
 StrCpy $ExpectedTarget "$INSTDIR\other.exe"
 Call CreateOwnedShortcut
 Call GetShortcutTarget
 FileOpen $0 "$INSTDIR\preserved-target.txt" w
 FileWriteUTF16LE $0 "$ShortcutTarget"
 FileClose $0
 StrCpy $ExpectedTarget "$INSTDIR\ZTH Design Studio.exe"
 StrCpy $CleanupFailed 0
 ; Allow reads but deny delete sharing, so COM can identify the link while deletion fails.
 System::Call 'kernel32::CreateFileW(w "$ShortcutPath", i 0x80000000, i 3, p 0, i 3, i 0, p 0) p.r7'
 Call TestDeleteOwnedShortcut
 FileOpen $0 "$INSTDIR\cleanup-failure.txt" w
 FileWrite $0 "$CleanupFailed"
 IfFileExists "$ShortcutPath" 0 +2
 FileWrite $0 "|preserved"
 FileClose $0
 System::Call 'kernel32::CloseHandle(p r7)'
 StrCpy $CleanupFailed 0
 Call TestDeleteOwnedShortcut
 !include "install-files.nsh"
 SetErrorLevel 5
 Quit
 install_rollback:
 Call RollbackFiles
 Call CleanupStaging
 SetErrorLevel 0
SectionEnd
`;
 fs.writeFileSync(path.join(build,'policy-tests.nsi'),script);
 const bundle=await require('app-builder-lib/out/toolsets/windows.js').getMakeNsisPath('0.0.0');
 const compile=spawnSync(bundle.path,['-INPUTCHARSET','UTF8','policy-tests.nsi'],{cwd:build,env:{...process.env,...bundle.env},encoding:'utf8'});if(compile.status!==0)throw Error(compile.stdout+compile.stderr);
 const run=spawnSync(path.resolve(build,'../policy-tests.exe'),[],{windowsHide:true,timeout:15000});if(run.status!==0)throw Error('Policy test executable failed: '+run.status);
 const oldRestored=files.every((f,i)=>fs.readFileSync(path.join(target,f),'utf8')==='old-'+i),sentinelPreserved=fs.readFileSync(path.join(target,'unrelated-sentinel.txt'),'utf8')==='keep-user-file',expected=path.join(target,'ZTH Design Studio.exe');
 const shortcutTargetCorrect=fs.readFileSync(path.join(target,'shortcut-target.txt'),'utf16le')===expected,foreignShortcutPreserved=fs.readFileSync(path.join(target,'preserved-target.txt'),'utf16le')===expected,stagingCleaned=!fs.existsSync(path.join(target,'stage'))&&!fs.existsSync(path.join(target,'backup'));
 const unicodeInstallMarker=fs.readFileSync(path.join(target,'ownership-path.txt'),'utf16le')===target,setupMutexHandle=Number(fs.readFileSync(path.join(target,'mutex-handle.txt'),'utf8'))>0;
 const shortcutDeletionFailureDetected=fs.readFileSync(path.join(target,'cleanup-failure.txt'),'utf8')==='1|preserved',shortcutDeletionRetrySucceeded=!fs.existsSync(path.join(target,'Owned shortcut.lnk'));
 const result={ok:oldRestored&&sentinelPreserved&&shortcutTargetCorrect&&foreignShortcutPreserved&&stagingCleaned&&unicodeInstallMarker&&setupMutexHandle&&shortcutDeletionFailureDetected&&shortcutDeletionRetrySucceeded,rollbackAfterMissingPayloadFile:oldRestored,sentinelPreserved,shortcutTargetCorrect,foreignShortcutPreserved,stagingCleaned,unicodeInstallMarker,setupMutexHandle,shortcutDeletionFailureDetected,shortcutDeletionRetrySucceeded};
 fs.writeFileSync('qa/installer-policy-v4.json',JSON.stringify({test:'Native NSIS harness with mock payload; no real installation',guiFlowTested:false,...result},null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
