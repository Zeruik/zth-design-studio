const fs=require('node:fs'),path=require('node:path');
function nsis(value){if(/[\r\n]/.test(value))throw Error('Invalid package filename');return value.replaceAll('$','$$').replaceAll('"','$\\"');}
function manifest(root){
 const files=[],directories=[];let bytes=0;
 function visit(dir){for(const name of fs.readdirSync(dir).sort()){if(name.toLowerCase()==='debug.log')continue;const full=path.join(dir,name),stat=fs.lstatSync(full);if(stat.isSymbolicLink())throw Error('Installer payload must not contain symbolic links');const relative=path.relative(root,full).replaceAll(path.sep,'\\');if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe package path');if(stat.isDirectory()){directories.push(relative);visit(full);}else{files.push(relative);bytes+=stat.size;}}}visit(root);
 const managed=[...new Set([...files,'icon.ico','zth-install.ini','Uninstall.exe'])];
 const install=['; Generated: replace only package-owned files; rollback restores prior bytes.'];
 managed.forEach((file,i)=>{const f=nsis(file),parent=path.win32.dirname(file);if(parent!=='.')install.push('StrCpy $InstallStep "创建程序子目录 / create directory: '+nsis(parent)+'"','ClearErrors','CreateDirectory "$INSTDIR\\'+nsis(parent)+'"','IfErrors install_rollback','CreateDirectory "$BackupDir\\'+nsis(parent)+'"','IfErrors install_rollback');install.push('StrCpy $InstallStep "备份旧程序 / back up: '+f+'"','ClearErrors','IfFileExists "$INSTDIR\\'+f+'" 0 no_backup_'+i,'Rename "$INSTDIR\\'+f+'" "$BackupDir\\'+f+'"','IfErrors install_rollback','no_backup_'+i+':','StrCpy $ChangedCount '+(i+1),'StrCpy $InstallStep "替换程序 / replace: '+f+'"','Rename "$StageDir\\'+f+'" "$INSTDIR\\'+f+'"','IfErrors install_rollback');});
 const rollback=[];managed.map((f,i)=>[f,i]).reverse().forEach(([file,i])=>{const f=nsis(file);rollback.push('IntCmp $ChangedCount '+(i+1)+' rollback_'+i+' rollback_skip_'+i+' rollback_'+i,'rollback_'+i+':','ClearErrors','Delete "$INSTDIR\\'+f+'"','IfFileExists "$BackupDir\\'+f+'" 0 rollback_skip_'+i,'ClearErrors','Rename "$BackupDir\\'+f+'" "$INSTDIR\\'+f+'"','IfErrors 0 rollback_skip_'+i,'StrCpy $RollbackFailed 1','rollback_skip_'+i+':');});
 // Electron may create this runtime file after launch; never embed it in setup.
 const removals=[...new Set(files.concat('icon.ico','debug.log'))].map(file=>'IfFileExists "$INSTDIR\\'+nsis(file)+'" 0 +2\nDelete "$INSTDIR\\'+nsis(file)+'"');
 return {bytes,files:managed,directories,install:install.join('\n')+'\n',rollback:rollback.join('\n')+'\n',uninstall:removals.join('\n')+'\n',removeDirectories:[...directories].reverse().map(d=>'RMDir "$INSTDIR\\'+nsis(d)+'"').join('\n')+'\n',validateDirectories:directories.map(d=>'!insertmacro RejectReparse "$INSTDIR\\'+nsis(d)+'"').join('\n')+'\n'};
}
module.exports={manifest};
