const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {atomicWriteFile,readProjectFile}=require('../desktop/files.cjs');
test('native export replaces a file atomically in a Chinese/spaced folder and leaves no temporary data',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'zth-files-test-'));try{const dir=path.join(root,'中文 空格');await fs.mkdir(dir);const target=path.join(dir,'作品.zthpmsj');await fs.writeFile(target,'original');await atomicWriteFile(target,Buffer.from('new portable project'));assert.equal(await fs.readFile(target,'utf8'),'new portable project');assert.deepEqual(await fs.readdir(dir),['作品.zthpmsj']);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('failed native export leaves an existing destination and unrelated file intact',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'zth-files-test-'));try{const target=path.join(root,'existing-directory');await fs.mkdir(target);await fs.writeFile(path.join(target,'keep.txt'),'do not delete');await assert.rejects(atomicWriteFile(target,Buffer.from('new bytes')));assert.equal(await fs.readFile(path.join(target,'keep.txt'),'utf8'),'do not delete');assert.deepEqual(await fs.readdir(root),['existing-directory']);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('project-file reader rejects directories and oversized files before content is read',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'zth-files-test-'));try{await assert.rejects(readProjectFile(root),/工程文件/);const target=path.join(root,'large.zthpmsj'),handle=await fs.open(target,'w');await handle.truncate(60*1024*1024+1);await handle.close();await assert.rejects(readProjectFile(target),/60 MB/);await fs.writeFile(target,'{"format":"zthpmsj"}');assert.equal(await readProjectFile(target),'{"format":"zthpmsj"}');}finally{await fs.rm(root,{recursive:true,force:true});}
});
