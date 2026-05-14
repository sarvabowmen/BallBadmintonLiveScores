import { readStore, writeStore } from '../data/store.js';

export default async function handler(req, res) {
  const store = await readStore();
  const urlPath = req.url || '';
  const pathSegments = urlPath.split('/').filter(Boolean);
  const matchId = req.query?.id || pathSegments[pathSegments.length - 1];

  if (!matchId || ['api', 'matches'].includes(matchId)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Match ID required' }));
  }

  const matchIndex = store.matches.findIndex((match) => match.id === matchId);

  if (matchIndex === -1) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Match not found' }));
  }

  if (req.method === 'GET') {
    const match = store.matches[matchIndex];
    const servingTeam = match.servingTeam || ((match.handCounts?.teamA || 0) > (match.handCounts?.teamB || 0) ? 'teamB' : 'teamA');
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ match: { ...match, servingTeam } }));
  }

  if (req.method === 'PATCH') {
    const body = await parseJson(req);
    store.matches[matchIndex] = {
      ...store.matches[matchIndex],
      ...body,
    };
    await writeStore(store);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ match: store.matches[matchIndex] }));
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method not allowed' }));
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
