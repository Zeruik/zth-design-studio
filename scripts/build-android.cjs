const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const windows = process.platform === 'win32';
const version = require('../package.json').version;
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || path.join(root, '.tools/android-sdk');
const platform = process.env.ZTH_ANDROID_PLATFORM || [path.join(sdk, 'platforms/android-35'), path.join(sdk, 'android-35')].find(p => fs.existsSync(path.join(p, 'android.jar')));
const buildTools = process.env.ZTH_ANDROID_BUILD_TOOLS || [path.join(sdk, 'build-tools/35.0.0'), path.join(sdk, 'android-15')].find(p => fs.existsSync(path.join(p, 'lib/apksigner.jar')));
if (!platform || !buildTools) throw Error('Set ZTH_ANDROID_PLATFORM and ZTH_ANDROID_BUILD_TOOLS to Android SDK platform 35 and build-tools 35.0.0.');
const javaBin = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin') : '';
const jdk = name => javaBin ? path.join(javaBin, name + (windows ? '.exe' : '')) : name;
const tool = name => path.join(buildTools, name + (windows ? '.exe' : ''));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(path.basename(command) + ' failed (' + result.status + ')');
}
const out = path.join(root, 'android/out');
fs.mkdirSync(out, { recursive: true });
for (const name of ['classes', 'dex']) {
  const target = path.join(out, name);
  // These are compiler outputs below android/out, never user projects.
  if (!target.startsWith(out + path.sep)) throw Error('Invalid output path');
  fs.rmSync(target, { force: true, recursive: true });
  fs.mkdirSync(target, { recursive: true });
}
fs.mkdirSync('release', { recursive: true });
const manifest = fs.readFileSync('android/AndroidManifest.xml', 'utf8');
if (!manifest.includes('android:versionName="' + version + '"')) throw Error('Android manifest/package version mismatch');
run(tool('aapt2'), ['compile', '--dir', 'android/res', '-o', path.join(out, 'resources.zip')]);
run(tool('aapt2'), ['link', '-o', path.join(out, 'base.apk'), '-I', path.relative(root, path.join(platform, 'android.jar')), '--manifest', 'android/AndroidManifest.xml', '-A', 'app', path.join(out, 'resources.zip')]);
run(jdk('javac'), ['-encoding', 'UTF-8', '-source', '8', '-target', '8', '-classpath', path.join(platform, 'android.jar'), '-d', path.join(out, 'classes'), 'android/src/studio/zerotohand/design/MainActivity.java']);
run(jdk('jar'), ['cf', path.join(out, 'classes.jar'), '-C', path.join(out, 'classes'), '.']);
run(jdk('java'), ['-cp', path.join(buildTools, 'lib/d8.jar'), 'com.android.tools.r8.D8', '--lib', path.join(platform, 'android.jar'), '--min-api', '28', '--output', path.join(out, 'dex'), path.join(out, 'classes.jar')]);
fs.copyFileSync(path.join(out, 'base.apk'), path.join(out, 'unsigned.apk'));
run(jdk('jar'), ['uf', path.join(out, 'unsigned.apk'), '-C', path.join(out, 'dex'), 'classes.dex']);
run(tool('zipalign'), ['-f', '-p', '4', path.join(out, 'unsigned.apk'), path.join(out, 'aligned.apk')]);

// A reusable local release identity. Neither key nor password is copied to the repository/release.
// For CI, provide all ZTH_ANDROID_KEYSTORE / ZTH_ANDROID_KEY_ALIAS / ZTH_ANDROID_KEY_PASSWORD_FILE.
const privateDir = process.env.ZTH_SIGNING_DIR || path.join(os.homedir(), '.codex', 'secrets', 'zth-design-studio');
const key = process.env.ZTH_ANDROID_KEYSTORE || path.join(privateDir, 'android-release.jks');
const passwordFile = process.env.ZTH_ANDROID_KEY_PASSWORD_FILE || path.join(privateDir, 'android-release-password.txt');
const alias = process.env.ZTH_ANDROID_KEY_ALIAS || 'zth-design-studio';
if (!fs.existsSync(key)) {
  if (process.env.ZTH_ANDROID_KEYSTORE) throw Error('Configured signing key does not exist');
  fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(passwordFile)) fs.writeFileSync(passwordFile, crypto.randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' });
  run(jdk('keytool'), ['-genkeypair', '-keystore', key, '-storepass:file', passwordFile, '-keypass:file', passwordFile, '-alias', alias, '-dname', 'CN=TechABJ,OU=ZTH Design Studio,O=ZeroToHand Studio,C=CN', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-storetype', 'JKS']);
}
if (!fs.existsSync(passwordFile)) throw Error('Signing password file missing');
const apk = path.resolve('release', `ZTH-Design-Studio-${version}-Android.apk`);
run(jdk('java'), ['-jar', path.join(buildTools, 'lib/apksigner.jar'), 'sign', '--ks', key, '--ks-key-alias', alias, '--ks-pass', 'file:' + passwordFile, '--out', apk, path.join(out, 'aligned.apk')]);
run(jdk('java'), ['-jar', path.join(buildTools, 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', apk]);
console.log('Android release APK:', apk);
