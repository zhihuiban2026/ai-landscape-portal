export const tools = [
  { id:'native-plant', name:'NativePlantAI', owner:'蘇芸德', url:'https://zhijing-v3.netlify.app/', keywords:['piet','自然種植','原生植物','台灣原生','台灣中部','大安溪','濁水溪','植栽替代','景觀植物','植栽設計','選種','多年生','宿根'], prompt:'請針對台灣原生植物、Piet Oudolf 自然種植法、植物選種與配置提出建議。' },
  { id:'studio-apartment', name:'AI 套房空間設計遊戲', owner:'王澄音', url:'https://studio-apartment-game.vercel.app/', keywords:['建築','空間','室內','平面','配置','格局','住宅','套房','小坪數','設計參數','需求轉譯','動線','坪數'], prompt:'請將使用者需求轉譯成小坪數住宅或室內空間配置、動線與設計參數。' },
  { id:'balcony-plant', name:'陽台植栽 AI 診斷機器人', owner:'曾宇凱', url:'https://balcony-plant-ai.vercel.app/', keywords:['陽台','盆栽','植物照顧','植物診斷','病蟲害','澆水','日照','通風','植栽養護','花園','植栽推薦'], prompt:'請針對陽台植栽條件、日照、通風、盆栽照護與植物健康診斷提出建議。' },
  { id:'restorative-env', name:'恢復性環境評估與改善機器人', owner:'莊旻栩', url:'https://restorative-env-ai.vercel.app/', keywords:['恢復性','art','注意力恢復','療癒','壓力','放鬆','環境評估','場域','自然感','心理恢復'], prompt:'請依注意力恢復理論與療癒性環境觀點，評估空間恢復性並提出改善建議。' },
  { id:'landscape-design', name:'AI 景觀設計研究', owner:'陳芅睿', url:'https://landscape-mci8.onrender.com/', keywords:['景觀設計','景觀分析','場地規劃','基地分析','景觀研究','戶外','庭園'], prompt:'請針對景觀設計、基地分析、場地規劃與設計策略提出整體建議。' }
];
export function pickTools(text){
  const lower=String(text||'').toLowerCase();
  const scored=tools.map(t=>({ ...t, score:t.keywords.reduce((n,k)=>n+(lower.includes(k.toLowerCase())?1:0),0) })).sort((a,b)=>b.score-a.score);
  const selected=scored.filter(t=>t.score>0).slice(0,4);
  if(!selected.length) selected.push(scored.find(t=>t.id==='landscape-design'));
  return selected;
}
export function localAnswer(tool, need){
  const lines={
    'native-plant':['盤點基地日照、水分、土壤與維護強度。','優先選擇符合台灣氣候與基地條件的原生或適地植物。','以季相、層次與群落穩定性安排植栽，而不是只看單株觀賞性。'],
    'studio-apartment':['先把使用者生活需求轉成空間功能清單。','檢查動線、收納、採光與家具尺度，避免只追求形式。','將限制條件轉成可調整的設計參數。'],
    'balcony-plant':['確認陽台方位、日照時數、風勢與澆水頻率。','依盆器大小與維護能力選擇耐受性較高的植物。','若有黃葉、徒長或病蟲害，先判斷水分與光照是否失衡。'],
    'restorative-env':['檢查遠離感、延展性、魅力感與相容性四個面向。','增加自然元素、柔和視覺焦點與可停留的舒適角落。','降低雜訊、壓迫感與過度複雜的動線。'],
    'landscape-design':['先做基地條件、使用者需求與限制盤點。','建立空間分區、動線、植栽與材料的整合策略。','把概念轉成可執行的設計步驟與後續驗證方式。']
  }[tool.id]||[];
  return `${tool.name} 工具回覆摘要：\n${lines.map((l,i)=>`${i+1}. ${l}`).join('\n')}\n針對本案「${String(need).slice(0,80)}${String(need).length>80?'…':''}」，建議以此工具產出更細部的專業結果。`;
}
export function integrate(need, mode, selected, answers){
  const modeLine=mode==='teaching'?'以下用教學模式，先說明原因再給步驟。':mode==='company'?'以下用公司模式，聚焦可執行策略與交付成果。':'以下採自動整合模式，兼顧專業建議與操作順序。';
  return `${modeLine}\n\n整合結論：此需求需要 ${selected.map(t=>t.name).join('、')} 協作。\n\n建議流程：\n${selected.map((t,i)=>`${i+1}. 操作「${t.name}」：${t.prompt}`).join('\n')}\n\n最終整合建議：\n- 先整理基地/空間條件、使用者需求、預算與維護能力。\n- 依工具輸出分別取得植栽、空間、恢復性或景觀策略。\n- 比對各工具建議是否衝突，例如植物需求與空間限制、療癒目標與維護成本。\n- 將共同指向的策略列為優先方案，衝突處保留為設計選項。\n\n各工具結果：\n${answers.map(a=>`\n【${a.tool.name}】\n${a.answer}`).join('\n')}`;
}
export function buildResult(need, mode='auto'){
  const selected=pickTools(need);
  const answers=selected.map(tool=>({tool,status:'worker-placeholder',answer:localAnswer(tool, need)}));
  return {selectedTools:selected.map(({id,name,owner,url,score,prompt})=>({id,name,owner,url,score,prompt})),answers:answers.map(a=>({tool:a.tool.name,status:a.status,answer:a.answer})),finalAnswer:integrate(need,mode,selected,answers)};
}
