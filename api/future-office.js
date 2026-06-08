const tools = [
  { id:'native-plant', name:'NativePlantAI', owner:'蘇芸德', url:'https://zhijing-v3.netlify.app/', keywords:['piet','自然種植','原生植物','台灣原生','台灣中部','大安溪','濁水溪','植栽替代','景觀植物','植栽設計','選種','多年生','宿根'], prompt:'請針對台灣原生植物、Piet Oudolf 自然種植法、植物選種與配置提出建議。' },
  { id:'studio-apartment', name:'AI 套房空間設計遊戲', owner:'王澄音', url:'https://studio-apartment-game.vercel.app/', keywords:['建築','空間','室內','平面','配置','格局','住宅','套房','小坪數','設計參數','需求轉譯','動線','坪數'], prompt:'請將使用者需求轉譯成小坪數住宅或室內空間配置、動線與設計參數。' },
  { id:'balcony-plant', name:'陽台植栽 AI 診斷機器人', owner:'曾宇凱', url:'https://balcony-plant-ai.vercel.app/', keywords:['陽台','盆栽','植物照顧','植物診斷','病蟲害','澆水','日照','通風','植栽養護','花園','植栽推薦'], prompt:'請針對陽台植栽條件、日照、通風、盆栽照護與植物健康診斷提出建議。' },
  { id:'restorative-env', name:'恢復性環境評估與改善機器人', owner:'莊旻栩', url:'https://restorative-env-ai.vercel.app/', keywords:['恢復性','art','注意力恢復','療癒','壓力','放鬆','環境評估','場域','自然感','心理恢復'], prompt:'請依注意力恢復理論與療癒性環境觀點，評估空間恢復性並提出改善建議。' },
  { id:'landscape-design', name:'AI 景觀設計研究', owner:'陳芅睿', url:'https://landscape-mci8.onrender.com/', keywords:['景觀設計','景觀分析','場地規劃','基地分析','景觀研究','戶外','庭園'], prompt:'請針對景觀設計、基地分析、場地規劃與設計策略提出整體建議。' }
];

function pickTools(text){
  const lower=text.toLowerCase();
  const scored=tools.map(t=>({ ...t, score:t.keywords.reduce((n,k)=>n+(lower.includes(k.toLowerCase())?1:0),0) }))
    .sort((a,b)=>b.score-a.score);
  const selected=scored.filter(t=>t.score>0).slice(0,4);
  if(!selected.length) selected.push(scored.find(t=>t.id==='landscape-design'));
  return selected;
}
function localAnswer(tool, need){
  const lines={
    'native-plant':['盤點基地日照、水分、土壤與維護強度。','優先選擇符合台灣氣候與基地條件的原生或適地植物。','以季相、層次與群落穩定性安排植栽，而不是只看單株觀賞性。'],
    'studio-apartment':['先把使用者生活需求轉成空間功能清單。','檢查動線、收納、採光與家具尺度，避免只追求形式。','將限制條件轉成可調整的設計參數。'],
    'balcony-plant':['確認陽台方位、日照時數、風勢與澆水頻率。','依盆器大小與維護能力選擇耐受性較高的植物。','若有黃葉、徒長或病蟲害，先判斷水分與光照是否失衡。'],
    'restorative-env':['檢查遠離感、延展性、魅力感與相容性四個面向。','增加自然元素、柔和視覺焦點與可停留的舒適角落。','降低雜訊、壓迫感與過度複雜的動線。'],
    'landscape-design':['先做基地條件、使用者需求與限制盤點。','建立空間分區、動線、植栽與材料的整合策略。','把概念轉成可執行的設計步驟與後續驗證方式。']
  }[tool.id]||[];
  return `${tool.name} 初步回覆：\n${lines.map((l,i)=>`${i+1}. ${l}`).join('\n')}\n針對本案「${need.slice(0,80)}${need.length>80?'…':''}」，建議先用此工具取得更細部的專業輸出。`;
}

async function callBalconyTool(need){
  const payload={
    physicalParams:{orientation:'south',floor:5,currentFloor:5,balconyDepth:120,balconyWidth:300,city:'台北市'},
    inputMode:'MODE_1_PEDESTRIAN'
  };
  const r=await fetch('https://balcony-plant-ai.vercel.app/api/diagnose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error('陽台植栽工具回應失敗 '+r.status);
  const buf=await r.arrayBuffer();
  const raw=new TextDecoder('utf-8').decode(buf);
  const events=raw.split('\n\n').filter(x=>x.startsWith('data: ')).map(x=>{try{return JSON.parse(x.slice(6))}catch{return null}}).filter(Boolean);
  const result=[...events].reverse().find(e=>e.event==='result') || events.find(e=>e.diagnosis);
  if(!result) return raw.slice(0,1800);
  const plants=(result.recommendedPlants||result.plants||[]).slice(0,3).map(p=>`${p.name||''}：${p.matchReason||p.description||''}`).join('\n');
  const report=result.diagnosis?.expertReport||result.expertReport||result.diagnosis?.summary||'';
  return `陽台植栽 AI 即時回覆：\n推薦植物：\n${plants||'未取得植物清單'}\n\n專家診斷摘要：\n${report.slice(0,1200)}${report.length>1200?'…':''}`;
}
async function callTool(tool, need){
  if(tool.id==='balcony-plant') return {status:'live', answer:await callBalconyTool(need)};
  return {status:'adapter-ready', answer:localAnswer(tool, need)};
}

function integrate(need, mode, selected, answers){
  const modeLine=mode==='teaching'?'以下用教學模式，先說明原因再給步驟。':mode==='company'?'以下用公司模式，聚焦可執行策略與交付成果。':'以下採自動整合模式，兼顧專業建議與操作順序。';
  return `${modeLine}\n\n整合結論：此需求需要 ${selected.map(t=>t.name).join('、')} 協作。建議先釐清基地/空間條件，再分別取得植栽、空間、恢復性或景觀策略，最後整合成一份設計方案。\n\n建議流程：\n${selected.map((t,i)=>`${i+1}. 使用「${t.name}」：${t.prompt}`).join('\n')}\n\n最終建議：\n- 先整理需求條件：地點、尺度、日照、使用者、預算與維護能力。\n- 依上方工具順序取得專項答案。\n- 比對各工具建議是否衝突，例如植物需求與空間限制、療癒目標與維護成本。\n- 將共同指向的策略列為優先方案，衝突處保留為設計選項。\n\n各工具回覆摘要：\n${answers.map(a=>`\n【${a.tool.name}】\n${a.answer}`).join('\n')}`;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const { need='', mode='auto' } = req.body||{};
  const clean=String(need).trim();
  if(!clean) return res.status(400).json({error:'請輸入需求'});
  const selected=pickTools(clean);
  const settled=await Promise.all(selected.map(async tool=>{
    try{const out=await callTool(tool, clean);return {tool, ...out};}
    catch(e){return {tool, status:'error-fallback', answer:localAnswer(tool, clean)+'\n\n（即時抓取失敗：'+(e?.message||'unknown')+'）'};}
  }));
  const answers=settled;
  return res.status(200).json({
    success:true,
    mode,
    selectedTools:selected.map(({id,name,owner,url,score,prompt})=>({id,name,owner,url,score,prompt})),
    answers:answers.map(a=>({tool:a.tool.name,status:a.status,answer:a.answer})),
    finalAnswer:integrate(clean, mode, selected, answers),
    note:'已開始接入真實工具回答：陽台植栽 AI 目前使用其 /api/diagnose 即時抓取；其他工具若無公開文字 API，暫以 adapter 回覆並保留工具連結。'
  });
}
