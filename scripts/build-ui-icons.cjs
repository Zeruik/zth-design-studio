const fs=require('node:fs');
require('esbuild').buildSync({entryPoints:['scripts/ui-icons.mjs'],outfile:'app/vendor/ui-icons.js',bundle:true,minify:true,format:'iife',legalComments:'eof'});
fs.copyFileSync('node_modules/lucide/LICENSE','app/vendor/licenses/lucide.txt');
console.log('Bundled selected Lucide icons and their licenses.');
