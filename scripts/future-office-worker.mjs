#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const tools = [
  { id:'native-plant', name:'NativePlantAI', url:'https://zhijing-v3.netlify.app/' },
  { id:'studio-apartment', name:'AI 套房空間設計遊戲', url:'https://studio-apartment-game.vercel.app/' },
  { id:'balcony-plant', name:'陽台植栽 AI 診斷機器人', url:'https://balcony-plant-ai.vercel.app/', disabled:true },
  { id:'restorative-env', name:'恢復性環境評估與改善機器人', url:'https://restorative-env-ai.vercel.app/', needsImage:true },
  { id:'landscape-design', name:'AI 景觀設計研究', url:'https://landscape-mci8.onrender.com/' }
];

function localSummary(tool, need){
  return `【${tool.name}】worker 已建立操作入口。需求：「${need}」。目前此腳本會檢查網站可連線狀態；下一步接瀏覽器自動填寫與擷取回答。`;
}
async function probe(tool, need){
  if(tool.disabled) return {tool:tool.name,status:'disabled',answer:'此工具暫停即時操作：外部模型限制或錯誤率過高。'};
  if(tool.needsImage) return {tool:tool.name,status:'needs_image',answer:'此工具需要圖片輸入；等待未來事務所加入圖片上傳後操作。'};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(tool.url,{signal:controller.signal});
    const html=await r.text();
    const title=(html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]||tool.name).trim();
    return {tool:tool.name,status:r.ok?'site_reachable':'site_error',url:tool.url,answer:`${localSummary(tool,need)}\n網站狀態：${r.status} ${r.statusText}\n頁面標題：${title}`};
  }catch(e){
    return {tool:tool.name,status:e.name==='AbortError'?'timeout':'error',url:tool.url,answer:`${localSummary(tool,need)}\n連線狀態：${e.name==='AbortError'?'逾時':e.message}`};
  }finally{clearTimeout(timer)}
}
async function main(){
  const need=process.argv.slice(2).join(' ').trim()||'測試未來事務所工具操作';
  const startedAt=new Date().toISOString();
  const results=[];
  for(const tool of tools) results.push(await probe(tool,need));
  const out={need,startedAt,finishedAt:new Date().toISOString(),results};
  await fs.mkdir('worker-results',{recursive:true});
  const file=path.join('worker-results',`future-office-${Date.now()}.json`);
  await fs.writeFile(file,JSON.stringify(out,null,2),'utf8');
  console.log(file);
  console.log(JSON.stringify(out,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
