# Native builds — ZTH Design Studio 2.0

The Windows, Android and iOS containers bundle the same `app/` directory. Build again after editor changes; a previously created package does not update itself from source. Run `npm ci` and `npm test` first. Do not upload `.tools/`, `node_modules/`, private signing material, personal screenshots or development recovery directories.

## Windows 10 / 11 x64

```powershell
npm run build:win
```

The build uses the pinned Electron version from `package-lock.json` and electron-builder's checksum-verified NSIS 3.0.4.1 download. The installer shows language selection, welcome, the license, install path and completion; it creates desktop/start-menu shortcuts, a `.zthpmsj` file association and an uninstaller. Default installation is per-user under `%LOCALAPPDATA%\Programs\ZTH Design Studio`. It does not need a Node.js installation on the user's PC.

Output: `release/ZTH-Design-Studio-2.0.0-Setup.exe`. `release/win-unpacked/` is for diagnostics, not a replacement for the installer. The installer has no purchased Authenticode certificate; Windows may show an unknown-publisher prompt. No Windows signing identity is invented.

To use an installed NSIS instead, set `ZTH_MAKENSIS` to its executable and optionally `ZTH_NSIS_DIR` to its root. Chinese checkout paths are copied to a temporary ASCII compiler directory because this NSIS version's source file globbing uses Windows ANSI paths. The build uses explicit directory traversal for copying to avoid a local Node `fs.cpSync` crash. Installer cleanup removes only its installed application files and keeps user data/history.

## Android 9+

Install a JDK plus Android SDK platform 35 and build-tools 35.0.0 from official Android tooling. Environment values:

| Variable | Meaning |
|---|---|
| `JAVA_HOME` | JDK root containing `bin/java`, `bin/javac`, `bin/jar`, `bin/keytool` |
| `ZTH_ANDROID_PLATFORM` | Platform directory containing `android.jar` |
| `ZTH_ANDROID_BUILD_TOOLS` | Build-tools directory containing `aapt2`, `zipalign` and `lib/` |
| `ANDROID_SDK_ROOT` or `ANDROID_HOME` | Optional normal SDK layout; the script also detects `.tools/android-sdk/` for a local tool cache |

```powershell
npm run build:android
```

Output: `release/ZTH-Design-Studio-2.0.0-Android.apk`. The script compiles Java, packages all web assets, creates DEX, aligns the APK, signs it and runs `apksigner verify --verbose --print-certs`. Android API 28+ supports the emitted v3 signature. No Gradle or Internet permission is needed by the installed app.

The local build creates and reuses a private release key at `~/.codex/secrets/zth-design-studio/android-release.jks`, with a random password in the same private directory. These files are outside the repo and must be backed up privately. They must never be published. To use an existing signing identity, set `ZTH_ANDROID_KEYSTORE`, `ZTH_ANDROID_KEY_ALIAS` and `ZTH_ANDROID_KEY_PASSWORD_FILE`; this script expects the private key password to equal the store password. CI must restore the same identity from secure storage, not generate a different key per release.

The 1.0 preview used a separate development key whose identity is unavailable here. Export important `.zthpmsj` works from 1.0 before changing installations. If signatures differ, Android requires uninstalling 1.0 first; that removes its local history, so backups are essential. Later builds signed by this saved 2.0 identity support normal upgrades.

Native window insets reserve the status bar, navigation bar, display cutout and keyboard area in either orientation. Actual phone file picking, gestures and inset behavior require device verification in addition to successful compilation/signing.

## iPhone / iPad

```sh
npm run build:ios
xcodebuild -project ios/ZTHDesignStudio.xcodeproj -scheme ZTHDesignStudio -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
```

Run Xcode commands on macOS with Xcode installed. Minimum iOS/iPadOS is 18, matching the bundled PDF.js WebKit requirements. `npm run build:ios` only prepares bundled resources; it does not produce an IPA. The GitHub workflow `iOS simulator build` runs an actual unsigned simulator build on a macOS runner and uploads a simulator `.app` ZIP plus logs. The simulator application cannot be installed on an iPhone.

For a phone, choose the actual development team in Xcode, register the Bundle ID/device as required and archive with an appropriate Apple certificate/profile. Distribute through the account's supported development, Ad Hoc, TestFlight or App Store route. A signing certificate, private key and provisioning profile cannot be inferred from a GitHub profile. See [the iOS build instructions](../ios/README.md) for archive commands and the exact acceptance scope.

## Web / Home Screen

`npm run build:web` creates `web/` for static HTTPS hosting. That build can be installed to the iPhone Home Screen from Safari, but remains a web app and should be labelled separately from the native iOS signing deliverables.

Primary references: [Android insets](https://developer.android.com/develop/ui/views/layout/edge-to-edge), [Apple provisioning](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile).
