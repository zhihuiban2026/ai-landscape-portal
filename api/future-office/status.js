import { buildResult, buildResultWithLive } from '../future-office-core.js';
function decode(id){try{return JSON.parse(Buffer.from(String(id),'base64url').toString('utf8'))}catch{return null}}
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({success:false,error:'Method not allowed'});
  const job=decode(req.query.id);
  if(!job?.need) return res.status(400).json({success:false,error:'無效任務'});
  const age=Date.now()-(job.ts||Date.now());
  const shouldCollect=age>3*1800;
  const result=shouldCollect?await buildResultWithLive(job.need,job.mode||'auto'):buildResult(job.need,job.mode||'auto');
  const steps=['建立任務','判斷需要的研究 AI','準備操作工具網站','收集工具回覆','整合最終答案'];
  const step=Math.min(steps.length-1,Math.floor(age/1800));
  const done=age>steps.length*1800;
  return res.status(200).json({success:true,jobId:req.query.id,status:done?'done':'running',step,steps,message:done?'整合完成':steps[step],...result,note:shouldCollect?'已進入實際工具收集階段：陽台植栽 AI 會嘗試即時抓取；其他工具等待後續 worker adapter。':'任務正在排程與準備工具操作。'});
}
