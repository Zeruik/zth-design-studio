// Keep the process alive until accepted native exports finish, even when closing.
function createWriteTracker(){
 const pending=new Set();
 function track(operation){const job=Promise.resolve().then(operation);pending.add(job);job.then(()=>pending.delete(job),()=>pending.delete(job));return job;}
 async function wait({ignoreErrors=false}={}){
  let failure;
  while(pending.size){const results=await Promise.allSettled([...pending]);for(const result of results)if(result.status==='rejected'&&!failure)failure=result.reason;}
  if(failure&&!ignoreErrors)throw failure;
 }
 return {track,wait};
}
module.exports={createWriteTracker};
