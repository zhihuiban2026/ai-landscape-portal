function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function sendAutoReply(to) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;
  if (!apiKey || !from || !isEmail(to)) return { sent:false, reason:'not_configured_or_not_email' };

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: '未來事務所已收到您的回饋',
      text: '親愛的使用者您好：\n\n已收到您的意見／來信，我們將盡快處理。\n謝謝您的意見！\n\n祝 順心\n\n未來事務所 團隊',
      html: '<p>親愛的使用者您好：</p><p>已收到您的意見／來信，我們將盡快處理。<br>謝謝您的意見！</p><p>祝 順心</p><p>未來事務所 團隊</p>',
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return { sent:false, reason: err.message || r.status };
  }
  return { sent:true };
}

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
  const cleanContact = String(contact||'').trim().slice(0,120);
  const item={
    id:'fb-'+Date.now(), created_at:now, type:String(type||'其他').slice(0,40),
    message:cleanMessage, contact:cleanContact,
    page:String(page||'').slice(0,240), status:'new'
  };
  current.items = Array.isArray(current.items) ? current.items : [];
  current.items.unshift(item);
  const sameTypeCount=current.items.filter(x=>x.type===item.type).length;
  if(sameTypeCount>=2) item.faq_candidate=true;
  const encoded=Buffer.from(JSON.stringify(current,null,2)).toString('base64');
  const putRes=await fetch(apiUrl,{method:'PUT',headers,body:JSON.stringify({message:`feat: add feedback ${item.id}`,content:encoded,...(sha&&{sha})})});
  if(!putRes.ok){const err=await putRes.json().catch(()=>({}));return res.status(500).json({success:false,error:'送出失敗：'+(err.message||putRes.status)});}

  let autoReply = { sent:false, reason:'no_email' };
  if (isEmail(cleanContact)) {
    try { autoReply = await sendAutoReply(cleanContact); }
    catch(e) { autoReply = { sent:false, reason:e?.message || 'send_failed' }; }
  }

  return res.status(200).json({success:true, faq_candidate:item.faq_candidate||false, auto_reply:autoReply});
}
