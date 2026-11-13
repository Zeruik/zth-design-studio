// Run after building all targets, including downloading the iOS simulator CI artifact.
const fs = require('node:fs'), path = require('node:path');
const JSZip = require('jszip'), asar = require('@electron/asar');
const version = require('../package.json').version;
process.chdir(path.resolve(__dirname, '..'));
const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file); else sourceFiles.push(file);
  }
}
walk('app');
(async () => {
  const targets = [
    ['Android', 'Android.apk', 'assets/'],
    ['Web', 'Web.zip', ''],
    ['iOS source', 'iOS-Source.zip', 'ios/ZTHDesignStudio/App/'],
    ['iOS simulator', 'iOS-Simulator.zip', 'ZTHDesignStudio.app/App/']
  ];
  const archives = [];
  for (const [name, suffix, prefix] of targets) {
    const archive = await JSZip.loadAsync(fs.readFileSync(`release/ZTH-Design-Studio-${version}-${suffix}`), { checkCRC32: true });
    if (Object.keys(archive.files).some(name => name.includes('\\'))) throw Error('Invalid ZIP separator: ' + name);
    archives.push({ name, archive, prefix });
  }
  const mismatches = [], lineEndingOnly = [];
  for (const file of sourceFiles) {
    const relative = file.replaceAll(path.sep, '/').slice(4), expected = fs.readFileSync(file);
    for (const { name, archive, prefix } of archives) {
      const entry = archive.file(prefix + relative);
      if (!entry) { mismatches.push(name + ':' + relative); continue; }
      const actual = await entry.async('nodebuffer');
      if (!actual.equals(expected)) {
        // Git normalizes tracked text to LF on the macOS CI runner.
        const isText = /\.(?:js|mjs|cjs|html|css|json|webmanifest|txt|svg|md)$/.test(relative);
        if (isText && actual.toString('utf8').replace(/\r\n/g, '\n') === expected.toString('utf8').replace(/\r\n/g, '\n')) lineEndingOnly.push(name + ':' + relative);
        else mismatches.push(name + ':' + relative);
      }
    }
    const desktop = asar.extractFile('release/win-unpacked/resources/app.asar', path.join('app', relative));
    if (!desktop.equals(expected)) mismatches.push('Windows:' + relative);
  }
  const result = { ok: mismatches.length === 0, checkedAppFiles: sourceFiles.length, targets: ['Windows ASAR', ...targets.map(t => t[0])], zipCRC: 'passed', lineEndingOnly, mismatches };
  fs.mkdirSync('qa', { recursive: true });
  fs.writeFileSync('qa/native-bundles-v2.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (mismatches.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
