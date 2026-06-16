import { toolProfiles } from './tool-profiles.js';

const synonyms = {
  '植物':['植栽','花草','盆栽','綠化','植被','原生植物'],
  '陽台':['露台','窗台','半戶外','立面','花槽'],
  '療癒':['放鬆','舒壓','壓力','恢復','安靜','注意力恢復','心理恢復'],
  '空間':['室內','房間','住宅','格局','配置','套房','平面'],
  '景觀':['戶外','庭園','公園','場地','基地','廣場','街景'],
  '城市':['都市','街道','街景','地圖','定位'],
  '照片':['圖片','影像','上傳','拍攝','現況照']
};
const negativeWords = ['不要','不想','不是','不需要','無需','不用','排除'];

function normalize(text){
  let out=String(text||'').toLowerCase();
  for(const [k,arr] of Object.entries(synonyms)){
    if(out.includes(k)) out+=' '+arr.join(' ');
    for(const w of arr) if(out.includes(w)) out+=' '+k;
  }
  return out;
}
function tokenize(text){
  return [...new Set(String(text||'').toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]{2,}/g)||[])];
}
function hasNegationNear(text, term){
  const idx=text.indexOf(term); if(idx<0) return false;
  const before=text.slice(Math.max(0,idx-8),idx);
  return negativeWords.some(w=>before.includes(w));
}
function profileTerms(profile){
  return [profile.project, profile.name, profile.scope, profile.description, ...(profile.bestFor||[]), ...(profile.exampleQuestions||[])].flatMap(tokenize);
}
function notForTerms(profile){ return [profile.notFor||[]].flat().flatMap(tokenize); }
function scoreProfile(profile, need){
  const text=normalize(need);
  const hits=[]; const warnings=[]; let score=0;
  const terms=profileTerms(profile).filter(t=>t.length>=2);
  const badTerms=notForTerms(profile).filter(t=>t.length>=2);
  for(const term of terms){
    if(text.includes(term) && !hasNegationNear(text,term)){
      if(!hits.includes(term)) hits.push(term);
      score += term.length>=4 ? 3 : 2;
    }
  }
  for(const term of badTerms){
    if(text.includes(term) && !hasNegationNear(text,term)){
      warnings.push(term); score -= 4;
    }
  }
  // Context-specific boosts/penalties from role cards.
  if(profile.id==='studio-apartment' && /套房|小坪|室內|平面|格局|家具|收納|租屋|住宅/.test(text)) score+=10;
  if(profile.id==='balcony-plant' && /陽台|露台|立面|綠視率|樓層|朝向|花槽/.test(text)) score+=12;
  if(profile.id==='native-plant' && /原生|台灣中部|日照|水分|海拔|boq|季相|自然主義|植栽表/.test(text)) score+=12;
  if(profile.id==='restorative-env' && /療癒|恢復性|art|心理|壓力|公園|廣場|庭院|改善模擬/.test(text)) score+=12;
  if(profile.id==='landscape-design' && /街景|城市|都市|定位|情緒|地圖|色彩|景觀元素/.test(text)) score+=12;
  if(profile.id==='restorative-env' && !/照片|圖片|上傳|現況照|公園|廣場|庭院/.test(text)) warnings.push('此工具通常需要環境照片');
  if(profile.id==='landscape-design' && !/街景|照片|定位|城市|都市/.test(text)) score-=2;
  if(profile.id==='studio-apartment' && /戶外|公園|街景|陽台|原生植物/.test(text)) score-=3;
  if(profile.id==='balcony-plant' && /大型|公園|街道|基地|城市/.test(text)) score-=5;
  if(profile.id==='native-plant' && /室內|套房|格局|病蟲害/.test(text)) score-=4;
  return {...profile, score, hits:hits.slice(0,10), warnings:[...new Set(warnings)].slice(0,4)};
}
function analyzeNeed(need, ranked){
  const text=normalize(need); const needs=[];
  if(/陽台|露台|立面|樓層|朝向|綠視率/.test(text)) needs.push('陽台環境與植栽配置');
  if(/原生|植栽|植物|日照|水分|季相|自然主義/.test(text)) needs.push('植物選擇與種植策略');
  if(/療癒|恢復|壓力|art|心理|舒壓/.test(text)) needs.push('恢復性與療癒環境評估');
  if(/套房|室內|格局|平面|家具|收納|住宅/.test(text)) needs.push('室內空間配置與居住偏好');
  if(/街景|城市|都市|定位|情緒|地圖/.test(text)) needs.push('城市街景與情緒景觀解析');
  if(!needs.length) needs.push('一般景觀與環境設計問題');
  const primary=ranked[0];
  return {
    intentSummary:`我理解你的需求主要涉及「${needs.join('、')}」。`,
    detectedNeeds:needs,
    primaryGoal: primary ? `先使用「${primary.name}」處理最核心的問題。` : '需要更多條件才能判斷主工具。'
  };
}
function confidenceFor(selected){
  if(selected.length===0) return {level:'low', reason:'沒有明確命中工具情境。'};
  const [a,b]=selected;
  if(a.score>=18 && (!b || a.score-b.score>=8)) return {level:'high', reason:'主工具分數明顯高於其他工具，情境判斷清楚。'};
  if(a.score>=10) return {level:'medium', reason:'有明確候選工具，但問題可能跨多個面向，建議依流程搭配使用。'};
  return {level:'low', reason:'問題描述較模糊，建議補充照片、基地條件、空間類型或主要目標。'};
}
function priority(profile, text){
  if(profile.id==='balcony-plant' && /陽台|露台|立面/.test(text)) return 8;
  if(profile.id==='studio-apartment' && /套房|室內|格局|住宅|平面/.test(text)) return 8;
  if(profile.id==='landscape-design' && /街景|城市|都市|情緒地圖|定位/.test(text)) return 8;
  if(profile.id==='native-plant' && /原生|植栽表|自然主義|季相/.test(text)) return 6;
  if(profile.id==='restorative-env' && /療癒|恢復性|art|心理恢復/.test(text)) return 6;
  return 0;
}
export function rankTools(need){
  const text=normalize(need);
  return toolProfiles.map(p=>scoreProfile(p,need)).sort((a,b)=>(b.score+priority(b,text))-(a.score+priority(a,text)));
}
export function recommend(need, mode='auto'){
  const ranked=rankTools(need);
  let selected=ranked.filter(t=>t.score>0).slice(0,3);
  if(!selected.length) selected=[ranked.find(t=>t.id==='landscape-design')||ranked[0]];
  const primary=selected[0]; const analysis=analyzeNeed(need,selected); const confidence=confidenceFor(selected);
  const order=selected.map((t,i)=>({
    step:i+1, id:t.id, name:t.name, owner:t.owner, url:t.url,
    purpose:i===0?'主工具：先處理問題核心':'輔助工具：補足延伸面向',
    reason:t.roleCard,
    hits:t.hits,
    warnings:t.warnings
  }));
  const finalAnswer=`${analysis.intentSummary}\n\n推薦主工具：${primary.name}\n研究者：${primary.owner}\n信心程度：${confidence.level}（${confidence.reason}）\n\n建議使用流程：\n${order.map(o=>`${o.step}. ${o.name}｜${o.purpose}\n   ${o.hits?.length?`判斷線索：${o.hits.slice(0,6).join('、')}\n   `:''}${o.warnings?.length?`注意：${o.warnings.join('、')}\n   `:''}`).join('\n')}\n為什麼這樣推薦：\n${selected.length>1?'這個問題可能包含多個需求面向，因此建議依流程使用多個工具，而不是只選單一工具。':'這個問題的核心情境較明確，先使用主工具即可。'}`;
  return {
    analysis, confidence, recommendedOrder:order,
    selectedTools:selected.map(({id,name,owner,url,score,hits,warnings,scope,bestFor,notFor,exampleQuestions})=>({id,name,owner,url,score,hits,warnings,scope,bestFor,notFor,exampleQuestions})),
    primary:{id:primary.id,name:primary.name,owner:primary.owner,url:primary.url,hits:primary.hits,scope:primary.scope},
    finalAnswer,
    note:'使用工具角色卡、適用/不適用情境與關鍵線索綜合推薦。'
  };
}
export function buildResult(need, mode='auto'){return recommend(need,mode)}
export async function buildResultWithLive(need, mode='auto'){return recommend(need,mode)}
