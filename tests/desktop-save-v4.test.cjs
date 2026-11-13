const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');

test('native save starts in Documents, remembers a chosen folder in memory, and ignores cancellation',async()=>{
 const source=fs.readFileSync('desktop/main.cjs','utf8'),body=source.slice(source.indexOf("ipcMain.handle('zth:save'"),source.indexOf('const fontFiles='));
 const shown=[],written=[],results=[{canceled:true},{canceled:false,filePath:'D:\\中文 空格\\作品.zthpmsj'},{canceled:true}];let save;
 const context={path:path.win32,Buffer,ArrayBuffer,lastSaveDirectory:undefined,win:{},trustedSender:()=>true,app:{getPath(name){assert.equal(name,'documents');return 'C:\\test-documents';}},dialog:{async showSaveDialog(_win,options){shown.push(options.defaultPath);return results.shift();}},ipcMain:{handle(_name,handler){save=handler;}},nativeWrites:{track:operation=>operation()},atomicWriteFile:async(file,bytes)=>written.push({file,bytes:bytes.toString()})};
 vm.createContext(context);vm.runInContext(body,context);
 const request={name:'作品.zthpmsj',bytes:Buffer.from('portable project')};
 assert.equal(await save({},request),false);assert.equal(context.lastSaveDirectory,undefined);
 assert.equal(await save({},request),true);assert.equal(context.lastSaveDirectory,'D:\\中文 空格');
 assert.equal(await save({},request),false);assert.equal(context.lastSaveDirectory,'D:\\中文 空格');
 assert.deepEqual(shown,['C:\\test-documents\\作品.zthpmsj','C:\\test-documents\\作品.zthpmsj','D:\\中文 空格\\作品.zthpmsj']);
 assert.deepEqual(written,[{file:'D:\\中文 空格\\作品.zthpmsj',bytes:'portable project'}]);
});
