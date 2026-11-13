const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');

(async () => {
  const archive = await JSZip.loadAsync(fs.readFileSync('android/out/base.apk'));
  let assets = 0;
  function addDirectory(directory, relative = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name), name = relative + entry.name;
      if (entry.isDirectory()) addDirectory(file, name + '/');
      else if (entry.isFile()) {
        // ZIP/Android asset paths must use '/', even when built on Windows.
        archive.file('assets/' + name, fs.readFileSync(file), { compression: 'DEFLATE' });
        assets++;
      } else throw Error('Unsupported asset entry: ' + file);
    }
  }
  addDirectory('app');
  archive.file('classes.dex', fs.readFileSync('android/out/dex/classes.dex'));
  const resources = archive.file('resources.arsc');
  if (!resources) throw Error('Compiled Android resources are missing');
  // Android 11+ requires resources.arsc to be stored and aligned in the APK.
  archive.file('resources.arsc', await resources.async('nodebuffer'), { compression: 'STORE' });
  if (Object.keys(archive.files).some(name => name.includes('\\'))) throw Error('Invalid Windows separator in APK entry');
  fs.writeFileSync('android/out/unsigned.apk', await archive.generateAsync({
    type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 }
  }));
  console.log('Bundled ' + assets + ' offline assets using Android-compatible paths.');
})().catch(error => { console.error(error); process.exitCode = 1; });
