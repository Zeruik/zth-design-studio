Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "x64.nsh"
!ifndef APP_VERSION
 !define APP_VERSION "4.0.0"
!endif
!ifndef APP_SIZE_KB
 !define APP_SIZE_KB 400000
!endif
Name "ZTH-平面设计器 / ZTH Design Studio ${APP_VERSION}"
OutFile "../release/ZTH-Design-Studio-${APP_VERSION}-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\ZTH Design Studio"
InstallDirRegKey HKCU "Software\ZeroToHand\DesignStudio" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetFont "Microsoft YaHei UI" 9
ShowInstDetails show
ShowUninstDetails show
VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "ZTH Design Studio"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "FileDescription" "ZTH Design Studio Installer"
VIAddVersionKey "CompanyName" "ZeroToHand Studio / TechABJ"
VIAddVersionKey "LegalCopyright" "Copyright ZeroToHand Studio / TechABJ"
!define MUI_ABORTWARNING
!define MUI_CUSTOMFUNCTION_ABORT AbortCleanup
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_WELCOMEPAGE_TITLE "ZTH Design Studio ${APP_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "$(WelcomeText)"
!define MUI_FINISHPAGE_RUN "$INSTDIR\ZTH Design Studio.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license-installer.txt"
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE DirectoryLeave
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!define MUI_UNCONFIRMPAGE_TEXT_TOP "$(UninstallText)"
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"
LangString WelcomeText ${LANG_SIMPCHINESE} "将为当前 Windows 用户安装 ${APP_VERSION}。$\r$\n$\r$\n位置：$INSTDIR$\r$\n$\r$\n你可以在下一步选择专用安装文件夹。升级会保留本机作品和历史记录。开始替换文件前，请保存作品并退出 ZTH Design Studio。"
LangString WelcomeText ${LANG_ENGLISH} "Install version ${APP_VERSION} for the current Windows user.$\r$\n$\r$\nLocation: $INSTDIR$\r$\n$\r$\nChoose a dedicated installation folder on the next page. Upgrades preserve your local designs and history. Save your work and close ZTH Design Studio before replacing files."
LangString UninstallText ${LANG_SIMPCHINESE} "只移除本安装的程序文件、快捷方式和注册信息。你的本机作品、历史记录及导出的工程不会被删除。"
LangString UninstallText ${LANG_ENGLISH} "Remove this installation's program files, shortcuts and registration. Local designs, history and exported projects are retained."
!include "installer-policy.nsh"
!include "installer-metadata.nsh"
Function .onInit
 SetShellVarContext current
 StrCpy $ChangedCount 0
 StrCpy $RollbackFailed 0
 StrCpy $ShortcutWarning 0
 Call AcquireSetupMutex
 ${IfNot} ${RunningX64}
  MessageBox MB_ICONSTOP "ZTH Design Studio requires 64-bit Windows. / 需要 64 位 Windows。"
  Abort
 ${EndIf}
 !insertmacro MUI_LANGDLL_DISPLAY
 ${IfNot} ${AtLeastWin10}
  MessageBox MB_ICONSTOP "ZTH Design Studio requires Windows 10 or later. / 需要 Windows 10 或更新版本。"
  Abort
 ${EndIf}
FunctionEnd
Function .onInstFailed
 ${If} $ChangedCount > 0
  Call RollbackFiles
 ${EndIf}
 Call CleanupStaging
FunctionEnd
Function AbortCleanup
 ${If} $ChangedCount > 0
  Call RollbackFiles
 ${EndIf}
 Call CleanupStaging
FunctionEnd
Function un.onInit
 SetShellVarContext current
 Call un.AcquireSetupMutex
 !insertmacro MUI_UNGETLANGUAGE
 Call un.CheckPath
 ReadINIStr $0 "$INSTDIR\zth-install.ini" "ZTH" "Owner"
 ReadINIStr $1 "$INSTDIR\zth-install.ini" "ZTH" "InstallDir"
 ${If} $0 != 'studio.zerotohand.design'
 ${OrIf} $1 != $INSTDIR
  MessageBox MB_ICONSTOP "无法确认这个目录属于本安装，未删除任何内容。$\r$\nInstallation ownership could not be verified."
  Abort
 ${EndIf}
 Call un.CheckNotRunning
FunctionEnd
Section "ZTH Design Studio"
 Call CheckInstallFolder
 StrCpy $InstallStep "创建暂存目录 / create staging directories"
 ClearErrors
 CreateDirectory "$INSTDIR"
 GetTempFileName $StageDir "$INSTDIR"
 Delete "$StageDir"
 CreateDirectory "$StageDir"
 GetTempFileName $BackupDir "$INSTDIR"
 Delete "$BackupDir"
 CreateDirectory "$BackupDir"
 IfErrors install_failed
 StrCpy $InstallStep "解包程序 / extract program files"
 SetOutPath "$StageDir"
 File /r /x debug.log "..\release\win-unpacked\*"
 File "icon.ico"
 IfErrors install_failed
 Call PrepareInstallMetadata
 IfErrors install_failed
 SetOutPath "$TEMP"
 Call CheckNotRunning
 GetDlgItem $0 $HWNDPARENT 2
 EnableWindow $0 0
 !include "install-files.nsh"
 StrCpy $ChangedCount 0
 Call CleanupStaging
 GetDlgItem $0 $HWNDPARENT 2
 EnableWindow $0 1
 ReadRegStr $0 HKCU "Software\ZeroToHand\DesignStudio" "AssociationBackupSaved"
 ${If} $0 != '1'
  ReadRegStr $1 HKCU "Software\Classes\.zthpmsj" ""
  ${If} $1 == 'ZTHPosterProject'
   StrCpy $1 ''
  ${EndIf}
  ClearErrors
  WriteRegStr HKCU "Software\ZeroToHand\DesignStudio" "PreviousProjectAssociation" "$1"
  WriteRegStr HKCU "Software\ZeroToHand\DesignStudio" "AssociationBackupSaved" "1"
  IfErrors integration_failed
 ${EndIf}
 ClearErrors
 WriteRegStr HKCU "Software\ZeroToHand\DesignStudio" "InstallDir" "$INSTDIR"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "DisplayName" "ZTH-平面设计器"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "DisplayVersion" "${APP_VERSION}"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "Publisher" "ZeroToHand Studio / TechABJ"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "InstallLocation" "$INSTDIR"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "DisplayIcon" "$INSTDIR\icon.ico"
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "NoRepair" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "EstimatedSize" ${APP_SIZE_KB}
 WriteRegStr HKCU "Software\Classes\.zthpmsj" "" "ZTHPosterProject"
 WriteRegStr HKCU "Software\Classes\ZTHPosterProject" "" "ZTH Poster Design Project"
 WriteRegStr HKCU "Software\Classes\ZTHPosterProject\DefaultIcon" "" "$INSTDIR\icon.ico"
 WriteRegStr HKCU "Software\Classes\ZTHPosterProject\shell\open\command" "" '$\"$INSTDIR\ZTH Design Studio.exe$\" $\"%1$\"'
 IfErrors integration_failed
 CreateDirectory "$SMPROGRAMS\ZTH Design Studio"
 StrCpy $ExpectedTarget "$INSTDIR\ZTH Design Studio.exe"
 StrCpy $ShortcutPath "$DESKTOP\ZTH-平面设计器.lnk"
 Call CreateOwnedShortcut
 StrCpy $ShortcutPath "$SMPROGRAMS\ZTH Design Studio\ZTH-平面设计器.lnk"
 Call CreateOwnedShortcut
 StrCpy $ExpectedTarget "$INSTDIR\Uninstall.exe"
 StrCpy $ShortcutPath "$SMPROGRAMS\ZTH Design Studio\卸载 Uninstall.lnk"
 Call CreateOwnedShortcut
 IfErrors integration_failed
 System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
 ${If} $ShortcutWarning == 1
  MessageBox MB_ICONINFORMATION "已有指向其他程序的同名快捷方式已保留。可从安装文件夹启动本软件。$\r$\nExisting unrelated shortcuts were preserved."
 ${EndIf}
 Goto install_done
 install_rollback:
 Call RollbackFiles
 install_failed:
 DetailPrint "失败阶段 / Failed step: $InstallStep"
 Call CleanupStaging
 MessageBox MB_ICONSTOP "安装没有完成。失败阶段：$InstallStep$\r$\n旧程序文件已尝试恢复。请检查剩余空间、目录权限，并退出正在运行的程序后重试。你的作品未被删除。$\r$\nInstallation failed; previous program files were restored where possible."
 SetErrorLevel 1
 Abort
 integration_failed:
 MessageBox MB_ICONSTOP "程序文件已安装，但快捷方式或系统登记未完成。请检查权限后重新运行安装器。$\r$\nFiles were installed, but shortcuts or registration failed."
 SetErrorLevel 1
 Abort
 install_done:
SectionEnd
Section "Uninstall"
 StrCpy $CleanupFailed 0
 Call un.CheckPath
 Call un.CheckNotRunning
 SetOutPath "$TEMP"
 ClearErrors
 !include "uninstall-files.nsh"
 IfErrors uninstall_failed
 StrCpy $ExpectedTarget "$INSTDIR\ZTH Design Studio.exe"
 StrCpy $ShortcutPath "$DESKTOP\ZTH-平面设计器.lnk"
 Call un.DeleteOwnedShortcut
 StrCpy $ShortcutPath "$SMPROGRAMS\ZTH Design Studio\ZTH-平面设计器.lnk"
 Call un.DeleteOwnedShortcut
 StrCpy $ExpectedTarget "$INSTDIR\Uninstall.exe"
 StrCpy $ShortcutPath "$SMPROGRAMS\ZTH Design Studio\卸载 Uninstall.lnk"
 Call un.DeleteOwnedShortcut
 RMDir "$SMPROGRAMS\ZTH Design Studio"
 ReadRegStr $0 HKCU "Software\ZeroToHand\DesignStudio" "InstallDir"
 ${If} $0 == $INSTDIR
  ReadRegStr $1 HKCU "Software\Classes\ZTHPosterProject\shell\open\command" ""
  ${If} $1 == '$\"$INSTDIR\ZTH Design Studio.exe$\" $\"%1$\"'
   ReadRegStr $2 HKCU "Software\Classes\.zthpmsj" ""
   ${If} $2 == 'ZTHPosterProject'
    ReadRegStr $3 HKCU "Software\ZeroToHand\DesignStudio" "PreviousProjectAssociation"
    ClearErrors
    ${If} $3 != ''
     WriteRegStr HKCU "Software\Classes\.zthpmsj" "" "$3"
    ${Else}
     DeleteRegValue HKCU "Software\Classes\.zthpmsj" ""
    ${EndIf}
    ${If} ${Errors}
     StrCpy $CleanupFailed 1
    ${Else}
     ; Keep an extension key that contains other applications' entries.
     DeleteRegKey /ifempty HKCU "Software\Classes\.zthpmsj"
    ${EndIf}
   ${EndIf}
   ${If} $CleanupFailed == 0
    ClearErrors
    DeleteRegKey HKCU "Software\Classes\ZTHPosterProject"
    ${If} ${Errors}
     StrCpy $CleanupFailed 1
    ${EndIf}
   ${EndIf}
  ${EndIf}
  ${If} $CleanupFailed == 0
   ReadRegStr $1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio" "UninstallString"
   ${If} $1 == '$\"$INSTDIR\Uninstall.exe$\"'
    ClearErrors
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZTHDesignStudio"
    ${If} ${Errors}
     StrCpy $CleanupFailed 1
    ${EndIf}
   ${EndIf}
   ${If} $CleanupFailed == 0
    ClearErrors
    DeleteRegKey HKCU "Software\ZeroToHand\DesignStudio"
    ${If} ${Errors}
     StrCpy $CleanupFailed 1
    ${EndIf}
   ${EndIf}
  ${EndIf}
 ${EndIf}
 ${If} $CleanupFailed == 1
  Goto uninstall_failed
 ${EndIf}
 System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
 Delete "$INSTDIR\zth-install.ini"
 Delete "$INSTDIR\Uninstall.exe"
 !include "uninstall-directories.nsh"
 RMDir "$INSTDIR"
 Goto uninstall_done
 uninstall_failed:
 MessageBox MB_ICONSTOP "部分文件、快捷方式或注册信息未能清理。请退出 ZTH 并检查权限后重试。作品及卸载程序已保留。$\r$\nCleanup was incomplete. The uninstaller and your designs were retained; check permissions and retry."
 SetErrorLevel 1
 Abort
 uninstall_done:
SectionEnd
