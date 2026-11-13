const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createWriteTracker}=require('../desktop/writes.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('retrying a failed close save keeps the actual close handler locked until retry finishes',async()=>{
 const source=fs.readFileSync('desktop/main.cjs','utf8'),body=source.slice(source.indexOf('async function requestClose()'),source.indexOf('app.setName('));
 let resolveRetry,calls=0,closed=0;const retry=new Promise(resolve=>resolveRetry=resolve);
 const context={closePending:false,closeApproved:false,nativeWrites:createWriteTracker(),win:{close(){closed++;}},flushBeforeClose:()=>++calls===1?Promise.reject(Error('save failure')):retry,dialog:{showMessageBox:async()=>({response:0})}};
 vm.createContext(context);vm.runInContext(body,context);const first=vm.runInContext('requestClose()',context);await tick();assert.equal(calls,2);assert.equal(context.closePending,true);await vm.runInContext('requestClose()',context);assert.equal(calls,2);resolveRetry();await first;assert.equal(closed,1);assert.equal(context.closePending,false);
});
test('native close barrier waits for accepted writes including a later concurrent export',async()=>{
 const writes=createWriteTracker();let finishFirst,finishSecond,settled=false;
 const first=writes.track(()=>new Promise(resolve=>finishFirst=resolve));await tick();const barrier=writes.wait().then(()=>settled=true);
 const second=writes.track(()=>new Promise(resolve=>finishSecond=resolve));await tick();finishFirst();await first;await tick();assert.equal(settled,false);finishSecond();await Promise.all([second,barrier]);assert.equal(settled,true);
});
test('write failure waits for all remaining writes before reporting and supports an explicit discard close',async()=>{
 const writes=createWriteTracker();let finish;
 const failed=writes.track(()=>Promise.reject(Error('disk failure')));failed.catch(()=>{});
 const active=writes.track(()=>new Promise(resolve=>finish=resolve));let finished=false;
 const barrier=writes.wait().then(()=>assert.fail('expected export failure'),error=>{assert.match(error.message,/disk failure/);finished=true;});await tick();assert.equal(finished,false);finish();await Promise.all([active,barrier]);assert.equal(finished,true);await writes.wait({ignoreErrors:true});
});
