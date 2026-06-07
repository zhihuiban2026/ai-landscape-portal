export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { index, description, password } = req.body ?? {};

  if (typeof index !== 'number' || !description || !password) {
    return res.status(400).json({ error: '參數錯誤' });
  }
  if (description.length > 1000) {
    return res.status(400).json({ error: '介紹文字過長（上限 1000 字）' });
  }

  // Fetch data.json to verify password
  let data;
  try {
    const r = await fetch(
      'https://raw.githubusercontent.com/zhihuiban2026/ai-landscape-portal/main/data.json'
    );
    data = await r.json();
  } catch {
    return res.status(500).json({ error: '無法讀取資料，請稍後再試' });
  }

  if (index < 0 || index >= data.length) {
    return res.status(400).json({ error: '無效的索引' });
  }
  if (data[index].password !== password) {
    return res.status(401).json({ error: '密碼錯誤' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({ error: '儲存功能目前已關閉' });
  }

  // Update description in data array
  data[index].description = description.trim();

  const owner = 'zhihuiban2026';
  const repo  = 'ai-landscape-portal';
  const path  = 'data.json';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'ai-landscape-portal-api',
    Accept: 'application/vnd.github+json',
  };

  // Get current SHA
  let sha;
  try {
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) sha = (await getRes.json()).sha;
  } catch { /* ok */ }

  const encoded = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `feat: update description for ${data[index].name}`,
      content: encoded,
      ...(sha && { sha }),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return res.status(500).json({ error: '儲存失敗：' + (err.message || putRes.status) });
  }

  return res.status(200).json({ success: true });
}
