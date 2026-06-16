import { buildResult, buildResultWithLive } from '../future-office-core.js';
function decode(id){try{return JSON.parse(Buffer.from(String(id),'base64url').toString('utf8'))}catch{return null}}
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({success:false,error:'Method not allowed'});
  const job=decode(req.query.id);
  if(!job?.need) return res.status(400).json({success:false,error:'無效任務'});
  const age=Date.now()-(job.ts||Date.now());
  const shouldCollect=age>3*1800;
  const result=shouldCollect?await buildResultWithLive(job.need,job.mode||'auto'):buildResult(job.need,job.mode||'auto');
  const steps=['閱讀問題','比對關鍵字','計算推薦分數','排序候選工具','產生推薦理由'];
  const step=Math.min(steps.length-1,Math.floor(age/1800));
  const done=age>steps.length*1800;
  return res.status(200).json({success:true,jobId:req.query.id,status:done?'done':'running',step,steps,message:done?'整合完成':steps[step],...result});
}
