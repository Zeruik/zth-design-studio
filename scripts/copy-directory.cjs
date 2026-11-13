const fs = require('node:fs');
const path = require('node:path');

// Avoid fs.cpSync's native recursive path on Windows checkouts with Unicode names.
module.exports = function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name), to = path.join(destination, entry.name);
    if (entry.isDirectory()) module.exports(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
    else throw Error('Unsupported non-file entry: ' + from);
  }
};
