const {spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs');
function run(cmd,args,opts={}){const r=spawnSync(cmd,args,{stdio:'inherit',...opts});if(r.status!==0)process.exit(r.status||1);}
if(process.argv.includes('--installer-only')){
 const packed=JSON.parse(require('@electron/asar').extractFile(path.resolve('release/win-unpacked/resources/app.asar'),'package.json').toString('utf8'));
 if(packed.version!==require('../package.json').version)throw Error('Packaged app version does not match the installer version');
 console.log('Recompiling installer from the existing packaged application.');
}else run(process.execPath,['scripts/package-windows.cjs']);
const payload=require('./installer-manifest.cjs').manifest(path.resolve('release/win-unpacked'));
for(const [name,key] of [['install-files','install'],['rollback-files','rollback'],['uninstall-files','uninstall'],['uninstall-directories','removeDirectories'],['validate-directories','validateDirectories']])fs.writeFileSync('build/'+name+'.nsh',payload[key]);
async function compileInstaller(){
 const env={...process.env};
 let nsis=process.env.ZTH_MAKENSIS;
 if(process.env.ZTH_NSIS_DIR)env.NSISDIR=process.env.ZTH_NSIS_DIR;
 if(!nsis&&process.platform==='win32'){
  // Reuse electron-builder's checksum-verified NSIS toolchain download.
  const {getMakeNsisPath}=require('app-builder-lib/out/toolsets/windows.js');
  const bundle=await getMakeNsisPath('0.0.0');
  nsis=bundle.path;
  Object.assign(env,bundle.env||{});
 }
 let working=path.resolve('build'),stage;
 // NSIS 3's build-time file globbing still uses the Windows ANSI code page.
 // Use a temporary ASCII build path when the checkout name contains Chinese.
 if(process.platform==='win32'&&/[^\x00-\x7f]/.test(working)){
  stage=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'zth-design-installer-'));
  const copyDirectory=require('./copy-directory.cjs');
  copyDirectory('build',path.join(stage,'build'));
  copyDirectory('release/win-unpacked',path.join(stage,'release/win-unpacked'));
  working=path.join(stage,'build');
 }
 // LicenseData has its own encoding detection, separate from -INPUTCHARSET.
 // Generate an explicit UTF-16LE BOM payload so Git normalization cannot break it.
 const license=fs.readFileSync(path.resolve('build/license.txt'),'utf8').replace(/^\uFEFF/,'').replace(/\r\n|\r|\n/g,'\r\n');
 fs.writeFileSync(path.join(working,'license-installer.txt'),Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(license,'utf16le')]));
 run(nsis||'makensis',['-INPUTCHARSET','UTF8','-DAPP_VERSION='+require('../package.json').version,'-DAPP_SIZE_KB='+Math.ceil(payload.bytes/1024),'installer.nsi'],{cwd:working,env});
 if(stage){
  const filename='ZTH-Design-Studio-'+require('../package.json').version+'-Setup.exe';
  fs.copyFileSync(path.join(stage,'release',filename),path.resolve('release',filename));
  const tempRoot=path.resolve(require('node:os').tmpdir());
  if(path.resolve(stage).startsWith(tempRoot+path.sep+'zth-design-installer-'))fs.rmSync(stage,{recursive:true,force:true});
 }
}
compileInstaller().catch(error=>{console.error(error);process.exitCode=1;});
