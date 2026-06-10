import { buildResult } from '../future-office-core.js';
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({success:false,error:'Method not allowed'});
  const {need='',mode='auto'}=req.body||{};
  const clean=String(need).trim();
  if(!clean) return res.status(400).json({success:false,error:'請輸入需求'});
  const id=Buffer.from(JSON.stringify({need:clean,mode,ts:Date.now()})).toString('base64url');
  const preview=buildResult(clean,mode);
  return res.status(200).json({success:true,jobId:id,status:'queued',message:'已建立未來事務所任務',selectedTools:preview.selectedTools});
}
