'use strict';
const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{const name=`ZTH-Design-Studio-${require('../package.json').version}-Setup.exe`,file=path.join('release',name),hash=crypto.createHash('sha256');for await(const b of sync.createReadStream(file))hash.update(b);await fs.writeFile(file+'.sha256',hash.digest('hex')+'  '+name+'\n',{flag:'wx'});console.log('Hashed verified installer '+name);})().catch(e=>{console.error(e.message);process.exitCode=1;});
