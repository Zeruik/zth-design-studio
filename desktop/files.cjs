const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
async function atomicWriteFile(target,bytes){
 const temporary=path.join(path.dirname(target),'.zth-export-'+crypto.randomUUID()+'.tmp');
 try{await fs.writeFile(temporary,bytes,{flag:'wx'});await fs.rename(temporary,target);}
 finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
async function readProjectFile(file){
 const stat=await fs.stat(file);if(!stat.isFile())throw Error('请选择 .zthpmsj 工程文件');if(stat.size>60*1024*1024)throw Error('工程超过 60 MB');
 const data=await fs.readFile(file);if(data.length>60*1024*1024)throw Error('工程超过 60 MB');return data.toString('utf8');
}
module.exports={atomicWriteFile,readProjectFile};
