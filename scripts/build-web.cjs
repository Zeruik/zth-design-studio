const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'web');
if (!target.startsWith(root + path.sep)) throw Error('Invalid output directory');
fs.rmSync(target, { recursive: true, force: true });
require('./copy-directory.cjs')(path.join(root, 'app'), target);
console.log('Offline web distribution prepared in web/');
