<?php
$i = max(0, (int)($_GET['i'] ?? 0));
$students = json_decode(file_get_contents(__DIR__ . '/data.json'), true);
if ($i >= count($students)) { header('Location: ./'); exit; }
$s = $students[$i];
$pf = __DIR__ . '/process-' . $i . '.json';
$entries = file_exists($pf) ? (json_decode(file_get_contents($pf), true) ?? []) : [];
usort($entries, fn($a, $b) => strcmp($a['date'] ?? '', $b['date'] ?? ''));
$total = count($students);
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($s['name']) ?> · 研究過程 — AI 智慧景觀設計</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f4f3ef;--card:#fff;--text:#1c1c1c;--muted:#7a7a7a;
  --accent:#3a5a40;--accent-bg:#eef3ee;--border:#e2ded7;--radius:12px;
}
body{font-family:'Noto Sans TC',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}

/* ── Top nav ── */
.topnav{
  position:sticky;top:0;z-index:50;
  background:rgba(244,243,239,.92);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--border);
  padding:14px 40px;display:flex;align-items:center;gap:16px;
}
.back{
  font-size:.82rem;color:var(--muted);text-decoration:none;
  display:flex;align-items:center;gap:5px;
  transition:color .2s;
}
.back:hover{color:var(--accent)}
.nav-divider{color:var(--border);font-size:.9rem}
.nav-title{font-size:.85rem;font-weight:500}

/* ── Header ── */
header{
  padding:60px 48px 48px;text-align:center;
  background:linear-gradient(160deg,#f0eeea 0%,#f4f3ef 60%);
  border-bottom:1px solid var(--border);
}
.eyebrow{
  display:inline-block;font-size:.72rem;letter-spacing:.35em;
  color:var(--accent);text-transform:uppercase;font-weight:500;
  margin-bottom:16px;padding:5px 16px;
  border:1px solid rgba(58,90,64,.3);border-radius:100px;
  background:rgba(58,90,64,.05);
}
h1{
  font-family:'Noto Serif TC',serif;
  font-size:clamp(1.6rem,4vw,2.6rem);
  font-weight:300;letter-spacing:.05em;margin-bottom:8px;
}
.header-project{font-size:.9rem;color:var(--accent);font-weight:500}
.header-count{font-size:.8rem;color:var(--muted);margin-top:6px}

/* ── Main ── */
main{max-width:860px;margin:0 auto;padding:56px 32px 120px}
.empty-state{
  text-align:center;padding:80px 32px;color:var(--muted);
  font-size:.9rem;line-height:2;
}

/* ── Entry ── */
.entry{
  background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius);padding:32px 36px;
  margin-bottom:20px;
  transition:box-shadow .2s;
}
.entry:hover{box-shadow:0 4px 24px rgba(0,0,0,.07)}
.entry-meta{
  display:flex;align-items:center;gap:12px;margin-bottom:16px;
}
.entry-date{
  font-size:.75rem;color:var(--accent);font-weight:500;
  background:var(--accent-bg);padding:4px 10px;border-radius:100px;
  letter-spacing:.04em;
}
.entry-idx{font-size:.72rem;color:var(--muted)}
.entry-title{
  font-family:'Noto Serif TC',serif;
  font-size:1.15rem;font-weight:400;margin-bottom:12px;
}
.entry-text{
  font-size:.9rem;color:#444;line-height:1.85;font-weight:300;
  white-space:pre-wrap;
}
.entry-images{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:10px;margin-top:18px;
}
.entry-images img{
  width:100%;aspect-ratio:4/3;object-fit:cover;
  border-radius:8px;cursor:pointer;
  transition:transform .2s,box-shadow .2s;
}
.entry-images img:hover{transform:scale(1.02);box-shadow:0 4px 16px rgba(0,0,0,.12)}

/* ── FAB ── */
.fab{
  position:fixed;bottom:36px;right:36px;
  padding:14px 24px;
  background:var(--accent);color:#fff;
  border:none;border-radius:100px;
  font-size:.88rem;font-family:'Noto Sans TC',sans-serif;
  cursor:pointer;box-shadow:0 4px 20px rgba(58,90,64,.35);
  transition:background .2s,transform .15s,box-shadow .2s;
  z-index:100;letter-spacing:.03em;
}
.fab:hover{background:#2d4831;transform:translateY(-2px);box-shadow:0 6px 28px rgba(58,90,64,.4)}

/* ── Modal ── */
.overlay{
  display:none;position:fixed;inset:0;
  background:rgba(20,20,20,.45);backdrop-filter:blur(4px);
  z-index:200;align-items:center;justify-content:center;
  padding:20px;
}
.overlay.open{display:flex}
.modal{
  background:#fff;border-radius:18px;
  padding:40px 36px;width:100%;max-width:520px;
  max-height:90vh;overflow-y:auto;
  box-shadow:0 24px 72px rgba(0,0,0,.18);
  animation:slideUp .2s ease;
}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal h2{font-family:'Noto Serif TC',serif;font-size:1.2rem;font-weight:400;margin-bottom:4px}
.modal .modal-sub{font-size:.82rem;color:var(--muted);margin-bottom:28px}
.field{margin-bottom:18px}
.field label{display:block;font-size:.76rem;color:var(--muted);letter-spacing:.06em;margin-bottom:7px}
.field input,.field textarea{
  width:100%;padding:10px 14px;
  border:1.5px solid var(--border);border-radius:8px;
  font-size:.88rem;font-family:'Noto Sans TC',sans-serif;
  outline:none;transition:border-color .18s;background:#fafaf8;
}
.field input:focus,.field textarea:focus{border-color:var(--accent);background:#fff}
.field textarea{height:140px;resize:vertical}
.file-hint{font-size:.74rem;color:var(--muted);margin-top:5px}
.modal-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
.btn-cancel{
  padding:9px 20px;background:transparent;
  border:1px solid var(--border);border-radius:7px;
  cursor:pointer;font-family:'Noto Sans TC',sans-serif;font-size:.84rem;
}
.btn-cancel:hover{background:#f5f5f2}
.btn-save{
  padding:9px 22px;background:var(--accent);color:#fff;
  border:none;border-radius:7px;cursor:pointer;
  font-family:'Noto Sans TC',sans-serif;font-size:.84rem;
  transition:background .2s;
}
.btn-save:hover{background:#2d4831}
.modal-msg{font-size:.82rem;margin-top:10px;text-align:right;min-height:1.2em}
.modal-msg.err{color:#c0392b}
.modal-msg.ok{color:var(--accent)}

/* ── Lightbox ── */
.lightbox{
  display:none;position:fixed;inset:0;
  background:rgba(0,0,0,.85);z-index:500;
  align-items:center;justify-content:center;cursor:zoom-out;
}
.lightbox.open{display:flex}
.lightbox img{max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain}

/* ── Footer ── */
footer{text-align:center;padding:28px;font-size:.78rem;color:var(--muted);border-top:1px solid var(--border)}

@media(max-width:640px){
  .topnav{padding:12px 20px}
  header{padding:40px 24px 36px}
  main{padding:36px 16px 100px}
  .entry{padding:24px 20px}
  .modal{padding:28px 20px}
  .fab{bottom:24px;right:20px}
}
</style>
</head>
<body>

<nav class="topnav">
  <a href="./" class="back">← 返回入口</a>
  <span class="nav-divider">/</span>
  <span class="nav-title"><?= htmlspecialchars($s['name']) ?> · 研究過程</span>
</nav>

<header>
  <span class="eyebrow">研究過程 · Process</span>
  <h1><?= htmlspecialchars($s['name']) ?></h1>
  <p class="header-project"><?= htmlspecialchars($s['project']) ?></p>
  <p class="header-count"><?= count($entries) ?> 筆記錄</p>
</header>

<main>
<?php if (empty($entries)): ?>
  <div class="empty-state">
    <p>尚無研究記錄</p>
    <p>點擊右下角「＋ 新增記錄」開始記錄研究過程、階段性成果與圖片</p>
  </div>
<?php else: ?>
  <?php foreach ($entries as $idx => $e): ?>
  <div class="entry">
    <div class="entry-meta">
      <span class="entry-date"><?= htmlspecialchars($e['date'] ?? '') ?></span>
      <span class="entry-idx">記錄 #<?= $idx + 1 ?></span>
    </div>
    <?php if (!empty($e['title'])): ?>
    <h2 class="entry-title"><?= htmlspecialchars($e['title']) ?></h2>
    <?php endif; ?>
    <?php if (!empty($e['text'])): ?>
    <p class="entry-text"><?= htmlspecialchars($e['text']) ?></p>
    <?php endif; ?>
    <?php if (!empty($e['images'])): ?>
    <div class="entry-images">
      <?php foreach ($e['images'] as $img): ?>
      <img src="uploads/<?= htmlspecialchars($img) ?>" alt="" loading="lazy"
           onclick="lightbox(this.src)">
      <?php endforeach; ?>
    </div>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>
<?php endif; ?>
</main>

<footer>© 2025 東海大學光點計畫 · AI 智慧景觀設計</footer>

<button class="fab" onclick="openModal()">＋ 新增記錄</button>

<!-- Modal -->
<div class="overlay" id="overlay">
  <div class="modal">
    <h2>新增研究記錄</h2>
    <p class="modal-sub"><?= htmlspecialchars($s['name']) ?> · <?= htmlspecialchars($s['project']) ?></p>
    <div class="field">
      <label>日期</label>
      <input type="date" id="m-date" value="<?= date('Y-m-d') ?>">
    </div>
    <div class="field">
      <label>標題（選填）</label>
      <input type="text" id="m-title" placeholder="例：初步調查、設計迭代、使用者測試…">
    </div>
    <div class="field">
      <label>研究過程說明</label>
      <textarea id="m-text" placeholder="描述這個階段的研究過程、方法、發現或心得"></textarea>
    </div>
    <div class="field">
      <label>圖片（選填，可多選）</label>
      <input type="file" id="m-imgs" accept="image/*" multiple>
      <p class="file-hint">支援 JPG、PNG、WebP，單張上限 10MB</p>
    </div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-save" onclick="submit()">新增記錄</button>
    </div>
    <p class="modal-msg" id="m-msg"></p>
  </div>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lb" onclick="this.classList.remove('open')">
  <img id="lb-img" src="" alt="">
</div>

<script>
const STUDENT_INDEX = <?= $i ?>;

function openModal(){document.getElementById('overlay').classList.add('open')}
function closeModal(){document.getElementById('overlay').classList.remove('open')}
function lightbox(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('open')}

async function submit(){
  const date=document.getElementById('m-date').value;
  const title=document.getElementById('m-title').value.trim();
  const text=document.getElementById('m-text').value.trim();
  const imgs=document.getElementById('m-imgs').files;
  const msg=document.getElementById('m-msg');

  if(!text&&imgs.length===0){msg.textContent='請填入說明或上傳圖片';msg.className='modal-msg err';return}

  msg.textContent='上傳中，請稍候…';msg.className='modal-msg';

  const fd=new FormData();
  fd.append('index',STUDENT_INDEX);
  fd.append('date',date);
  fd.append('title',title);
  fd.append('text',text);
  for(let f of imgs) fd.append('images[]',f);

  try{
    const r=await fetch('add-entry.php',{method:'POST',body:fd});
    const res=await r.json();
    if(res.success){
      msg.textContent='新增成功！';msg.className='modal-msg ok';
      setTimeout(()=>location.reload(),800);
    }else{
      msg.textContent=res.error||'發生錯誤';msg.className='modal-msg err';
    }
  }catch(e){
    msg.textContent='網路錯誤，請稍後再試';msg.className='modal-msg err';
  }
}

document.getElementById('overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});
</script>
</body>
</html>
