export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const body = await parseJson(req);
  const { username, password } = body;

  if (username === 'user' && password === 'admin') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, token: 'authenticated' }));
  }

  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
}

async function parseJson(req) {
  if (req.body) return req.body;
  const chunks = [];
  try {
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks).toString('utf-8');
    return data ? JSON.parse(data) : {};
  } catch (err) {
    return req.body || {};
  }
}
