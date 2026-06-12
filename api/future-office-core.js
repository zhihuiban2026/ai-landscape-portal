export const tools = [
  { id:'native-plant', name:'NativePlantAI', owner:'蘇芸德', url:'https://zhijing-v3.netlify.app/', domains:['原生植物','自然種植','植栽選種'], keywords:['piet','自然種植','原生植物','台灣原生','台灣中部','大安溪','濁水溪','植栽替代','景觀植物','植栽設計','選種','多年生','宿根','草花','季相','植物配置','生態','低維護','耐旱','耐陰','適地適種'], prompt:'適合處理台灣原生植物、Piet Oudolf 自然種植法、植物選種、植栽配置與低維護景觀。' },
  { id:'studio-apartment', name:'AI 套房空間設計遊戲', owner:'王澄音', url:'https://studio-apartment-game.vercel.app/', domains:['建築空間','室內配置','需求轉譯'], keywords:['建築','空間','室內','平面','配置','格局','住宅','套房','小坪數','設計參數','需求轉譯','動線','坪數','房間','家具','收納','採光','生活機能','單身','獨居','租屋','平面圖'], prompt:'適合處理小坪數住宅、室內配置、空間需求轉譯、動線、家具與生活機能分析。' },
  { id:'balcony-plant', name:'陽台植栽 AI 診斷機器人', owner:'曾宇凱', url:'https://balcony-plant-ai.vercel.app/', domains:['陽台植栽','植物照護','盆栽診斷'], keywords:['陽台','盆栽','植物照顧','植物診斷','病蟲害','澆水','日照','通風','植栽養護','花園','植栽推薦','西曬','半日照','全日照','遮陰','葉子變黃','枯萎','爛根','介殼蟲','新手種植'], prompt:'適合處理陽台植栽、盆栽照護、日照通風、植物健康診斷與居家種植建議。' },
  { id:'restorative-env', name:'恢復性環境評估與改善機器人', owner:'莊旻栩', url:'https://restorative-env-ai.vercel.app/', domains:['療癒環境','恢復性評估','ART'], keywords:['恢復性','art','注意力恢復','療癒','壓力','放鬆','環境評估','場域','自然感','心理恢復','冥想','舒壓','疲勞','專注','安靜','庇護','遠離感','魅力感','延展性','相容性'], prompt:'適合處理注意力恢復理論、療癒性環境、心理壓力、空間恢復性評估與改善策略。' },
  { id:'landscape-design', name:'城市景觀解析', owner:'陳芅睿', url:'https://landscape-mci8.onrender.com/', domains:['景觀設計','基地分析','場地規劃'], keywords:['景觀設計','景觀分析','場地規劃','基地分析','景觀研究','戶外','庭園','公園','校園','廣場','開放空間','動線','分區','設計概念','設計策略','水景','鋪面','節點','視線','使用者分析'], prompt:'適合處理城市景觀解析、基地分析、場地規劃、空間分區、動線與整體設計策略。' }
];
const synonyms = {
  '植物':['植栽','花草','盆栽','綠化','植被'],
  '陽台':['露台','窗台','半戶外'],
  '療癒':['放鬆','舒壓','壓力','恢復','安靜'],
  '空間':['室內','房間','住宅','格局','配置'],
  '景觀':['戶外','庭園','公園','場地','基地']
};
function expandText(text){let out=String(text||'').toLowerCase();for(const [k,arr] of Object.entries(synonyms)){if(out.includes(k)) out+=' '+arr.join(' ');for(const w of arr) if(out.includes(w)) out+=' '+k;}return out;}
export function rankTools(text){
  const lower=expandText(text);
  return tools.map(t=>{
    const hits=[]; let score=0;
    for(const k of t.keywords){ if(lower.includes(k.toLowerCase())){hits.push(k); score+=2;} }
    for(const d of t.domains){ if(lower.includes(d.toLowerCase())){hits.push(d); score+=3;} }
    if(t.id==='landscape-design' && /設計|規劃|改善|空間|場地/.test(lower)) score+=1;
    return {...t,score,hits:[...new Set(hits)]};
  }).sort((a,b)=>b.score-a.score);
}
export function recommend(need, mode='auto'){
  const ranked=rankTools(need);
  const selected=ranked.filter(t=>t.score>0).slice(0,3);
  if(!selected.length) selected.push(ranked.find(t=>t.id==='landscape-design'));
  const primary=selected[0];
  const steps=selected.map((t,i)=>`${i+1}. ${t.name}：${t.prompt}${t.hits?.length?`\n   命中關鍵字：${t.hits.join('、')}`:''}`).join('\n');
  const finalAnswer=`推薦主工具：${primary.name}\n研究者：${primary.owner}\n\n為什麼推薦：\n你的問題中出現或隱含了「${primary.hits?.slice(0,6).join('、')||'景觀/空間設計'}」等線索，因此最適合先使用 ${primary.name}。\n\n建議使用順序：\n${steps}\n\n使用方式：\n- 如果只想快速得到答案，先點主工具。\n- 如果問題跨領域，依上方順序逐一使用工具，再把各工具答案合併判斷。\n- 若推薦結果不符合期待，請補充基地位置、空間類型、日照、使用者需求或是否有圖片。`;
  return {selectedTools:selected.map(({id,name,owner,url,score,prompt,hits,domains})=>({id,name,owner,url,score,prompt,hits,domains})),primary:{id:primary.id,name:primary.name,owner:primary.owner,url:primary.url,hits:primary.hits,prompt:primary.prompt},finalAnswer,note:'依關鍵字與問題情境推薦適合工具。'};
}
export function buildResult(need, mode='auto'){return recommend(need,mode)}
export async function buildResultWithLive(need, mode='auto'){return recommend(need,mode)}
