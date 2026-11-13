# Android 2.0 packaging

Android 9 (API 28) or newer is required. The APK bundles the editor, fonts, templates and QR implementation. The manifest requests no Internet or broad storage permission; imports and exports use Android's document picker.

The native container applies status/navigation bars, display cutouts and keyboard insets around the WebView. Both orientations are supported; orientation changes keep the WebView and current design alive. The app does not hide the phone's status bar.

## Build

Install a JDK, Android SDK platform 35 and build-tools 35.0.0 from official Android tools. Set `JAVA_HOME`, `ZTH_ANDROID_PLATFORM` (the folder with `android.jar`) and `ZTH_ANDROID_BUILD_TOOLS` (the folder with `aapt2`, `zipalign` and `lib/`). Then run:

```sh
npm run build:android
```

The Node build script works on Windows, macOS and Linux and requires no Gradle project. It produces `release/ZTH-Design-Studio-3.0.0-Android.apk` and verifies its signature with `apksigner`.

## Keep the signing identity

By default, the first build creates a unique reusable RSA signing key and random password in the current user's `.codex/secrets/zth-design-studio/` directory, outside the repository. Subsequent local builds reuse them. Back up that directory privately: losing the signing key prevents upgrades to existing installations. Never publish the key or password to GitHub or include them in release ZIP files.

For managed builds, set `ZTH_ANDROID_KEYSTORE`, `ZTH_ANDROID_KEY_ALIAS` and `ZTH_ANDROID_KEY_PASSWORD_FILE`. The private key password is expected to match the keystore password. CI must restore the same privately stored identity; creating a new key for each build breaks upgrades.

The earlier 1.0 preview used an unretained development signature. Compatibility of that signature with this 2.0 key is not established. If Android reports a signature conflict, first open 1.0 and export every important `.zthpmsj` project, then uninstall it and install 2.0. Uninstalling Android apps removes local histories; exported files remain in the location you selected. Versions built with this same 2.0 signing identity can upgrade normally.

Current build verification covers compilation, APK contents, manifest and cryptographic signing. Physical-device file selection, storage behavior and insets still require device acceptance when no Android device is connected.

Reference: [Android edge-to-edge and window insets](https://developer.android.com/develop/ui/views/layout/edge-to-edge).
