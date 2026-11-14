; Write and verify ownership before replacing any installed program files.
Function PrepareInstallMetadata
 StrCpy $InstallStep "安装标记：打开文件 / marker: open"
 ClearErrors
 FileOpen $0 "$StageDir\zth-install.ini" w
 IfErrors metadata_failed
 StrCpy $InstallStep "安装标记：写入 UTF-16 / marker: write UTF-16"
 FileWriteUTF16LE /BOM $0 "[ZTH]$\r$\n"
 IfErrors metadata_close_failed
 StrCpy $InstallStep "安装标记：关闭文件 / marker: close"
 FileClose $0
 IfErrors metadata_failed
 StrCpy $InstallStep "安装标记：写入所有者 / marker: write owner"
 WriteINIStr "$StageDir\zth-install.ini" "ZTH" "Owner" "studio.zerotohand.design"
 IfErrors metadata_failed
 StrCpy $InstallStep "安装标记：写入目录 / marker: write directory"
 WriteINIStr "$StageDir\zth-install.ini" "ZTH" "InstallDir" "$INSTDIR"
 IfErrors metadata_failed
 StrCpy $InstallStep "安装标记：写入版本 / marker: write version"
 WriteINIStr "$StageDir\zth-install.ini" "ZTH" "Version" "${APP_VERSION}"
 IfErrors metadata_failed
 ; Win32's normal cache-flush call returns zero. NSIS FlushINI turns that
 ; into its error flag, so isolate it after checking every actual write.
 ; Verify all values after the flush rather than treating its flag as I/O failure.
 FlushINI "$StageDir\zth-install.ini"
 ClearErrors
 StrCpy $InstallStep "安装标记：校验所有者 / marker: verify owner"
 ReadINIStr $1 "$StageDir\zth-install.ini" "ZTH" "Owner"
 IfErrors metadata_failed
 StrCmp $1 "studio.zerotohand.design" 0 metadata_failed
 StrCpy $InstallStep "安装标记：校验目录 / marker: verify directory"
 ReadINIStr $1 "$StageDir\zth-install.ini" "ZTH" "InstallDir"
 IfErrors metadata_failed
 StrCmp $1 "$INSTDIR" 0 metadata_failed
 StrCpy $InstallStep "安装标记：校验版本 / marker: verify version"
 ReadINIStr $1 "$StageDir\zth-install.ini" "ZTH" "Version"
 IfErrors metadata_failed
 StrCmp $1 "${APP_VERSION}" 0 metadata_failed
 StrCpy $InstallStep "创建卸载程序 / create uninstaller"
 WriteUninstaller "$StageDir\Uninstall.exe"
 IfErrors metadata_failed
 ClearErrors
 Return
 metadata_close_failed:
 FileClose $0
 metadata_failed:
 SetErrors
FunctionEnd
