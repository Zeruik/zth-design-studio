'use strict';
// Preserve the actual runner status and expose synthetic test failures even
// when full GitHub logs require authentication.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function annotation(message){console.error('::error::'+String(message).slice(0,2400).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));}
const prepared=spawnSync(process.execPath,['scripts/prepare-test-fonts.cjs'],{stdio:'inherit'});
if(prepared.error||prepared.status!==0){annotation(prepared.error?.message||'Verified native test font preparation failed');process.exit(prepared.status||1);}
const files=fs.readdirSync('tests').filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join('tests',name));
const result=spawnSync(process.execPath,['--test','--test-reporter=spec',...files],{encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,NO_COLOR:'1'}});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
if(result.error)annotation(result.error.message);
if(result.status!==0){const text=(result.stdout||'')+'\n'+(result.stderr||''),detail=text.indexOf('failing tests:');annotation(detail>=0?text.slice(detail):text.slice(-2400));}
process.exit(result.status??1);
