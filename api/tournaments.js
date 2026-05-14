import { createId, readStore, writeStore } from '../data/store.js';

export default async function handler(req, res) {
  const store = await readStore();
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  const tournamentId = req.query?.id || pathSegments[pathSegments.length - 1];

  if (req.method === 'POST' && pathname === '/api/tournaments') {
    const body = await parseJson(req);
    const id = createId('tournament');
    const tournament = {
      id,
      name: body.name || 'Untitled Tournament',
      location: body.location || '',
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    const matches = (body.schedule || []).map((item) => ({
      id: createId('match'),
      tournamentId: id,
      teamA: item.teamA,
      teamB: item.teamB,
      date: item.date || '',
      time: item.time || '',
      round: item.round || '',
      live: false,
      sets: [
        { teamA: 0, teamB: 0 },
        { teamA: 0, teamB: 0 },
        { teamA: 0, teamB: 0 },
      ],
      handCounts: { teamA: 0, teamB: 0 },
      playingFive: { teamA: '', teamB: '' },
      winner: null,
    }));

    store.tournaments.push(tournament);
    store.matches.push(...matches);
    await writeStore(store);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ tournament, matches }));
  }

  if (req.method === 'GET') {
    // If tournamentId is 'tournaments', 'api', or empty, it's likely a list request
    const isDetailRequest = tournamentId && !['api', 'tournaments'].includes(tournamentId);

    if (!isDetailRequest) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ tournaments: store.tournaments }));
    }

    const tournament = store.tournaments.find((item) => item.id === tournamentId);
    if (!tournament) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Tournament not found' }));
    }
    const matches = store.matches.filter((match) => match.tournamentId === tournament.id);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ tournament, matches }));
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
