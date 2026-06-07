export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { index, blocks, password } = req.body ?? {};

  if (typeof index !== 'number' || !Array.isArray(blocks) || !password) {
    return res.status(400).json({ error: '參數錯誤' });
  }

  // Verify password against data.json
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
    return res.status(400).json({ error: '無效的研究員索引' });
  }
  if (data[index].password !== password) {
    return res.status(401).json({ error: '密碼錯誤' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({ error: '上傳功能目前已關閉' });
  }

  const owner = 'zhihuiban2026';
  const repo  = 'ai-landscape-portal';
  const path  = `process-${index}.json`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'ai-landscape-portal-api',
    Accept: 'application/vnd.github+json',
  };

  // Get current file SHA (needed for update)
  let sha;
  try {
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) {
      const current = await getRes.json();
      sha = current.sha;
    }
  } catch { /* file may not exist yet */ }

  const fileContent = JSON.stringify({ blocks }, null, 2);
  const encoded = Buffer.from(fileContent).toString('base64');

  const body = {
    message: `feat: update process-${index} (${data[index].name})`,
    content: encoded,
    ...(sha && { sha }),
  };

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    return res.status(500).json({ error: '儲存失敗：' + (errData.message || putRes.status) });
  }

  return res.status(200).json({ success: true });
}
