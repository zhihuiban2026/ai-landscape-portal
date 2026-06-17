export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });
  const { type='', message='', contact='', page='' } = req.body ?? {};
  const cleanMessage = String(message).trim();
  if (!cleanMessage) return res.status(400).json({ success:false, error:'請輸入回饋內容' });
  if (cleanMessage.length > 1200) return res.status(400).json({ success:false, error:'回饋內容過長（上限 1200 字）' });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(503).json({ success:false, error:'回饋功能目前暫時關閉' });

  const owner='zhihuiban2026', repo='ai-landscape-portal', path='feedback.json';
  const apiUrl=`https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers={Authorization:`token ${token}`,'Content-Type':'application/json','User-Agent':'ai-landscape-portal-api',Accept:'application/vnd.github+json'};
  let current={items:[]}, sha;
  try{
    const getRes=await fetch(apiUrl,{headers});
    if(getRes.ok){
      const file=await getRes.json(); sha=file.sha;
      current=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
    }
  }catch{ current={items:[]}; }
  const now=new Date().toISOString();
  const item={
    id:'fb-'+Date.now(), created_at:now, type:String(type||'其他').slice(0,40),
    message:cleanMessage, contact:String(contact||'').trim().slice(0,120),
    page:String(page||'').slice(0,240), status:'new'
  };
  current.items = Array.isArray(current.items) ? current.items : [];
  current.items.unshift(item);
  const sameTypeCount=current.items.filter(x=>x.type===item.type).length;
  if(sameTypeCount>=2) item.faq_candidate=true;
  const encoded=Buffer.from(JSON.stringify(current,null,2)).toString('base64');
  const putRes=await fetch(apiUrl,{method:'PUT',headers,body:JSON.stringify({message:`feat: add feedback ${item.id}`,content:encoded,...(sha&&{sha})})});
  if(!putRes.ok){const err=await putRes.json().catch(()=>({}));return res.status(500).json({success:false,error:'送出失敗：'+(err.message||putRes.status)});}
  return res.status(200).json({success:true, faq_candidate:item.faq_candidate||false});
}
