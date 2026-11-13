!include "FileFunc.nsh"
Var StageDir
Var BackupDir
Var ChangedCount
Var RollbackFailed
Var OldInstallDir
Var ProbeParent
Var WriteProbe
Var SetupMutex
Var ShortcutPath
Var ShortcutTarget
Var ExpectedTarget
Var ShortcutWarning
Var CleanupFailed

!macro RejectReparse DIRECTORY
 System::Call 'kernel32::GetFileAttributesW(w "${DIRECTORY}") i.r8'
 ${If} $8 != -1
  IntOp $9 $8 & 0x10
  ${If} $9 == 0
   MessageBox MB_ICONSTOP "安装路径中有同名文件，请选择文件夹。$\r$\nThe installation path contains a file, not a folder."
   Abort
  ${EndIf}
  IntOp $9 $8 & 0x400
  ${If} $9 != 0
   MessageBox MB_ICONSTOP "安装目录包含链接或联接点，请选择真实的本地文件夹。$\r$\nLinked folders are not supported: ${DIRECTORY}"
   Abort
  ${EndIf}
 ${EndIf}
!macroend
!macro RejectTree DIRECTORY
 GetFullPathName $0 "${DIRECTORY}"
 StrLen $1 "$0\"
 StrCpy $2 "$INSTDIR\" $1
 ${If} $2 == "$0\"
  Goto unsafe_path
 ${EndIf}
!macroend

!macro CommonPolicy PREFIX
Function ${PREFIX}CheckPath
 ; Reject UNC, device, relative and root paths before creating anything.
 StrCpy $0 $INSTDIR 2 1
 ${If} $0 != ':\'
  Goto unsafe_path
 ${EndIf}
 ClearErrors
 GetFullPathName $INSTDIR "$INSTDIR"
 IfErrors unsafe_path
 StrLen $0 $INSTDIR
 ${If} $0 <= 3
 ${OrIf} $0 > 220
  Goto unsafe_path
 ${EndIf}
 StrCpy $1 2
 StrCpy $3 ''
 path_char_loop:
 StrCpy $2 $INSTDIR 1 $1
 ${If} $2 == ''
  ${If} $3 == ' '
  ${OrIf} $3 == '.'
   Goto unsafe_path
  ${EndIf}
  Goto path_chars_done
 ${EndIf}
 ${If} $2 == ':'
 ${OrIf} $2 == '*'
 ${OrIf} $2 == '?'
 ${OrIf} $2 == '<'
 ${OrIf} $2 == '>'
 ${OrIf} $2 == '|'
 ${OrIf} $2 == '$\"'
  Goto unsafe_path
 ${EndIf}
 ${If} $2 == '\'
  ${If} $3 == ' '
  ${OrIf} $3 == '.'
   Goto unsafe_path
  ${EndIf}
 ${EndIf}
 StrCpy $3 $2
 IntOp $1 $1 + 1
 Goto path_char_loop
 path_chars_done:
 !insertmacro RejectTree "$WINDIR"
 !insertmacro RejectTree "$PROGRAMFILES"
 !insertmacro RejectTree "$PROGRAMFILES64"
 !insertmacro RejectTree "$WINDIR\..\ProgramData"
 ${If} $INSTDIR == $PROFILE
 ${OrIf} $INSTDIR == $DESKTOP
 ${OrIf} $INSTDIR == $DOCUMENTS
 ${OrIf} $INSTDIR == $APPDATA
 ${OrIf} $INSTDIR == $LOCALAPPDATA
 ${OrIf} $INSTDIR == "$LOCALAPPDATA\Programs"
 ${OrIf} $INSTDIR == $TEMP
  Goto unsafe_path
 ${EndIf}
 StrCpy $5 $INSTDIR
 path_ancestor_loop:
 !insertmacro RejectReparse "$5"
 StrLen $6 $5
 ${If} $6 <= 3
  Goto path_ancestors_done
 ${EndIf}
 ${GetParent} "$5" $5
 Goto path_ancestor_loop
 path_ancestors_done:
 !include "validate-directories.nsh"
 Return
 unsafe_path:
 MessageBox MB_ICONSTOP "请选择专用的本地应用文件夹（不超过 220 字符）。不能直接安装到磁盘根目录、系统目录或个人文件夹根目录。$\r$\nChoose a dedicated local application folder outside system locations."
 Abort
FunctionEnd
Function ${PREFIX}CheckNotRunning
 IfFileExists "$INSTDIR\ZTH Design Studio.exe" 0 process_check_done
 process_check_retry:
 System::Call 'kernel32::CreateFileW(w "$INSTDIR\ZTH Design Studio.exe", i 0xC0000000, i 0, p 0, i 3, i 0, p 0) p.r0'
 ${If} $0 == -1
  MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "请先保存作品并退出 ZTH Design Studio，再点“重试”。若已经退出，请检查目录是否可写。程序不会被强制结束。$\r$\nSave your work and close ZTH Design Studio, then retry." IDRETRY process_check_retry
  Abort
 ${EndIf}
 System::Call 'kernel32::CloseHandle(p r0)'
 process_check_done:
FunctionEnd
Function ${PREFIX}AcquireSetupMutex
 System::Call 'kernel32::CreateMutexW(p 0, i 0, w "Local\ZeroToHand.DesignStudio.Setup") p.s ?e'
 Pop $0
 Pop $SetupMutex
 ${If} $0 == 183
  MessageBox MB_ICONSTOP "另一个 ZTH 安装或卸载程序正在运行。请先关闭它。$\r$\nAnother ZTH setup process is running."
  Abort
 ${EndIf}
FunctionEnd
; IShellLinkW and IPersistFile are built-in Windows COM interfaces.
Function ${PREFIX}GetShortcutTarget
 StrCpy $ShortcutTarget ''
 System::Call 'ole32::CoInitialize(p 0) i.r5'
 System::Call 'ole32::CoCreateInstance(g "{00021401-0000-0000-C000-000000000046}", p 0, i 1, g "{000214F9-0000-0000-C000-000000000046}", *p .r1) i.r0'
 ${If} $0 == 0
  System::Call '$1->0(g "{0000010B-0000-0000-C000-000000000046}", *p .r2) i.r0'
  ${If} $0 == 0
   System::Call '$2->5(w "$ShortcutPath", i 0) i.r0'
   ${If} $0 == 0
    System::Call '$1->3(w .r3, i ${NSIS_MAX_STRLEN}, p 0, i 4) i.r0'
    ${If} $0 == 0
     StrCpy $ShortcutTarget $3
    ${EndIf}
   ${EndIf}
   System::Call '$2->2()'
  ${EndIf}
  System::Call '$1->2()'
 ${EndIf}
 ${If} $5 == 0
 ${OrIf} $5 == 1
  System::Call 'ole32::CoUninitialize()'
 ${EndIf}
FunctionEnd
!macroend
!insertmacro CommonPolicy ""
!insertmacro CommonPolicy "un."

Function CheckInstallFolder
 Call CheckPath
 ReadRegStr $OldInstallDir HKCU "Software\ZeroToHand\DesignStudio" "InstallDir"
 ${If} $OldInstallDir != ''
  IfFileExists "$OldInstallDir\ZTH Design Studio.exe" 0 no_registered_install
  GetFullPathName $OldInstallDir "$OldInstallDir"
  ${If} $OldInstallDir != $INSTDIR
   MessageBox MB_ICONSTOP "现有安装位于：$OldInstallDir$\r$\n升级请沿用原位置。需要更换位置时，请先卸载原程序；作品不会被卸载删除。$\r$\nUpgrade in the existing location, or uninstall before choosing a new folder."
   Abort
  ${EndIf}
 ${EndIf}
 no_registered_install:
 FindFirst $0 $1 "$INSTDIR\*"
 folder_scan:
 ${If} $1 == ''
  Goto folder_empty
 ${EndIf}
 ${If} $1 != '.'
 ${AndIf} $1 != '..'
  FindClose $0
  ${If} $OldInstallDir == $INSTDIR
   Goto check_prior_files
  ${EndIf}
  ReadINIStr $2 "$INSTDIR\zth-install.ini" "ZTH" "Owner"
  ReadINIStr $3 "$INSTDIR\zth-install.ini" "ZTH" "InstallDir"
  ${If} $2 == 'studio.zerotohand.design'
  ${AndIf} $3 == $INSTDIR
   Goto check_prior_files
  ${EndIf}
  Goto foreign_folder
 ${EndIf}
 FindNext $0 $1
 Goto folder_scan
 folder_empty:
 FindClose $0
 Goto test_write
 check_prior_files:
 IfFileExists "$INSTDIR\ZTH Design Studio.exe" 0 foreign_folder
 IfFileExists "$INSTDIR\resources\app.asar" 0 foreign_folder
 IfFileExists "$INSTDIR\Uninstall.exe" 0 foreign_folder
 Goto test_write
 foreign_folder:
 MessageBox MB_ICONSTOP "文件夹已有其他文件，且不是已登记的 ZTH 安装。请选择空文件夹或现有 ZTH 安装位置。$\r$\nChoose an empty folder or the recognized ZTH installation."
 Abort
 test_write:
 StrCpy $ProbeParent $INSTDIR
 probe_parent_loop:
 IfFileExists "$ProbeParent\*" probe_write
 ${GetParent} "$ProbeParent" $ProbeParent
 StrLen $0 $ProbeParent
 ${If} $0 < 3
  Goto probe_failed
 ${EndIf}
 Goto probe_parent_loop
 probe_write:
 ClearErrors
 GetTempFileName $WriteProbe "$ProbeParent"
 IfErrors probe_failed
 Delete "$WriteProbe"
 IfErrors probe_failed
 Call CheckNotRunning
 Return
 probe_failed:
 MessageBox MB_ICONSTOP "所选目录不可写，请选择当前用户可写的文件夹。$\r$\nThis location is not writable by the current user."
 Abort
FunctionEnd
Function DirectoryLeave
 Call CheckInstallFolder
FunctionEnd
!macro RemoveOwnedTemporary DIRECTORY
 ${If} ${DIRECTORY} != ''
  StrLen $0 "$INSTDIR\"
  StrCpy $1 ${DIRECTORY} $0
  ${If} $1 == "$INSTDIR\"
   System::Call 'kernel32::GetFileAttributesW(w "${DIRECTORY}") i.r8'
   IntOp $9 $8 & 0x400
   ${If} $9 == 0
    RMDir /r "${DIRECTORY}"
   ${EndIf}
  ${EndIf}
 ${EndIf}
!macroend
Function CleanupStaging
 SetOutPath "$TEMP"
 !insertmacro RemoveOwnedTemporary "$StageDir"
 ${If} $RollbackFailed != 1
  !insertmacro RemoveOwnedTemporary "$BackupDir"
 ${EndIf}
FunctionEnd
Function RollbackFiles
 StrCpy $RollbackFailed 0
 !include "rollback-files.nsh"
 StrCpy $ChangedCount 0
 ${If} $RollbackFailed == 1
  MessageBox MB_ICONSTOP "部分旧文件无法自动恢复。请保留此备份目录：$BackupDir$\r$\nRollback needs manual recovery; keep the backup folder above."
 ${EndIf}
FunctionEnd
Function CreateOwnedShortcut
 IfFileExists "$ShortcutPath" 0 create_shortcut
 Call GetShortcutTarget
 ${If} $ShortcutTarget != $ExpectedTarget
  StrCpy $ShortcutWarning 1
  Return
 ${EndIf}
 create_shortcut:
 CreateShortcut "$ShortcutPath" "$ExpectedTarget" "" "$INSTDIR\icon.ico"
FunctionEnd
Function un.DeleteOwnedShortcut
 IfFileExists "$ShortcutPath" 0 delete_shortcut_done
 Call un.GetShortcutTarget
 ${If} $ShortcutTarget == $ExpectedTarget
  ClearErrors
  Delete "$ShortcutPath"
  ${If} ${Errors}
   StrCpy $CleanupFailed 1
  ${EndIf}
 ${EndIf}
 delete_shortcut_done:
FunctionEnd
