const {app,BrowserWindow,ipcMain,dialog,session,shell}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {atomicWriteFile,readProjectFile}=require('./files.cjs');
const nativeWrites=require('./writes.cjs').createWriteTracker();
const editorFile=path.join(__dirname,'../app/index.html'),editorURL=pathToFileURL(editorFile).href;
const publicReferences=new Set([
 'https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/printed-image-resolution.html',
 'https://helpx.adobe.com/illustrator/using/printers-marks-bleeds.html',
 'https://www.qrcode.com/en/howto/code.html'
]);
let win,rendererReady=false,closeApproved=false,closePending=false;
let pendingFile=process.argv.find(a=>a.toLowerCase().endsWith('.zthpmsj'));
const trustedURL=url=>typeof url==='string'&&url.split(/[?#]/)[0]===editorURL;
const trustedSender=e=>e.sender===win?.webContents&&e.senderFrame===win.webContents.mainFrame&&trustedURL(e.senderFrame.url);
async function openProject(file){
 if(!file)return;
 if(!rendererReady){pendingFile=file;return;}
 try{win.webContents.send('zth:project',await readProjectFile(file));}
 catch(error){dialog.showErrorBox('打开工程失败',error.message);}
}
async function flushBeforeClose(){
 await nativeWrites.wait();
 if(!rendererReady||win.webContents.isDestroyed()||win.webContents.isCrashed())return;
 let timer;
 try{await Promise.race([
  win.webContents.executeJavaScript(`(async()=>{
   document.activeElement?.blur();const E=window.ZTH_EDITOR;
   const text=E?.canvas?.getActiveObject();if(text?.isEditing)text.exitEditing();
   await new Promise(resolve=>setTimeout(resolve,0));await E?.whenIdle?.();
   if(window.ZTH_WORKS){const saved=await ZTH_WORKS.save();if(saved?.skipped)throw Error('作品在其他窗口更新或已被删除，当前修改尚未保存。');}
  })()`),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('保存等待超时。请返回工作台确认或导出作品备份。')),15000);})
 ]);await nativeWrites.wait();}finally{clearTimeout(timer);}
}
async function requestClose(){
 if(closePending)return;closePending=true;
 try{await flushBeforeClose();closeApproved=true;win.close();}
 catch(error){
  const result=await dialog.showMessageBox(win,{type:'warning',title:'作品尚未保存',message:'关闭前未能确认保存完成',detail:error.message,buttons:['重试保存','返回工作台','不保存并关闭'],defaultId:0,cancelId:1,noLink:true});
  closePending=false;
  if(result.response===0)return await requestClose();
  if(result.response===2){await nativeWrites.wait({ignoreErrors:true});closeApproved=true;win.close();}
 }finally{closePending=false;}
}
app.setName('ZTH-平面设计器');
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',(_,argv)=>{if(win){if(win.isMinimized())win.restore();win.focus();}openProject(argv.find(a=>a.toLowerCase().endsWith('.zthpmsj')));});
 app.whenReady().then(async()=>{
  const dataDirectory=app.getPath('userData');await fs.mkdir(dataDirectory,{recursive:true});
  const probe=path.join(dataDirectory,'.zth-write-'+crypto.randomUUID());await fs.writeFile(probe,'ok',{flag:'wx'});await fs.unlink(probe);
  const prefs={preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true};
  win=new BrowserWindow({width:1480,height:980,minWidth:760,minHeight:620,backgroundColor:'#f7f6f9',title:'ZTH-平面设计器',icon:path.join(__dirname,'../app/assets/app-icon.png'),webPreferences:prefs});
  win.setMenuBarVisibility(false);win.webContents.setWindowOpenHandler(({url})=>{if(publicReferences.has(url))shell.openExternal(url).catch(error=>dialog.showErrorBox('无法打开参考资料',error.message));return {action:'deny'};});
  win.webContents.on('will-navigate',(event,url)=>{if(!trustedURL(url))event.preventDefault();});
  win.webContents.on('did-start-loading',()=>{rendererReady=false;});
  win.on('close',event=>{if(!closeApproved){event.preventDefault();requestClose();}});
  session.defaultSession.setPermissionRequestHandler((_,__,cb)=>cb(false));
  await win.loadFile(editorFile);
 }).catch(error=>{dialog.showErrorBox('ZTH 启动失败','无法打开工作台，请检查安装文件及用户数据目录的写入权限。\n'+error.message);closeApproved=true;app.quit();});
}
ipcMain.on('zth:ready',event=>{if(!trustedSender(event))return;rendererReady=true;if(pendingFile){const file=pendingFile;pendingFile=null;openProject(file);}});
ipcMain.handle('zth:save',async(event,request)=>{
 if(!trustedSender(event)||!request||typeof request.name!=='string'||!ArrayBuffer.isView(request.bytes)||request.bytes.byteLength>250*1024*1024)throw Error('无效的导出请求');
 const name=path.basename(request.name).replace(/[<>:"/\\|?*]/g,'-');if(!/\.(zthpmsj|png|jpg|svg|pdf)$/i.test(name))throw Error('不支持的文件格式');
 const result=await dialog.showSaveDialog(win,{defaultPath:name});if(result.canceled)return false;
 await nativeWrites.track(()=>atomicWriteFile(result.filePath,Buffer.from(request.bytes.buffer,request.bytes.byteOffset,request.bytes.byteLength)));return true;
});
const fontFiles=Object.freeze({'ZTH Sans':'ZTHSans.woff2','ZCOOL XiaoWei':'ZCOOLXiaoWei.woff2','Ma Shan Zheng':'MaShanZheng.woff2','Roboto Mono':'RobotoMono.woff2'});
ipcMain.handle('zth:font',async(event,name='ZTH Sans')=>{if(!trustedSender(event)||typeof name!=='string'||!Object.hasOwn(fontFiles,name))throw Error('不支持的内置字体');return 'data:font/woff2;base64,'+(await fs.readFile(path.join(__dirname,'../app/assets/fonts',fontFiles[name]))).toString('base64');});
ipcMain.handle('zth:environment',event=>{if(!trustedSender(event))throw Error('无效的请求');return `${process.platform} ${os.release()} · ${os.arch()} · 内存 ${Math.round(os.totalmem()/1024**3)} GB · Electron ${process.versions.electron} · 应用 ${app.getVersion()} · 本地运行时已内置`;});
app.on('window-all-closed',()=>app.quit());
