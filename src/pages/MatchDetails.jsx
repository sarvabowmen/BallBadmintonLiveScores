import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const defaultSet = { teamA: 0, teamB: 0 };

function computeWinner(sets) {
  const result = { teamA: 0, teamB: 0 };
  sets.forEach((set) => {
    if (set.teamA > set.teamB) result.teamA += 1;
    if (set.teamB > set.teamA) result.teamB += 1;
  });
  if (result.teamA === 2) return 'teamA';
  if (result.teamB === 2) return 'teamB';
  return null;
}

export default function MatchDetails({ editable = false }) {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');
  const [handCounts, setHandCounts] = useState({ teamA: 0, teamB: 0 });
  const [sets, setSets] = useState([defaultSet, defaultSet, defaultSet]);
  const [setWinners, setSetWinners] = useState([null, null, null]);
  const [matchWinner, setMatchWinner] = useState(null);
  const [servingTeam, setServingTeam] = useState('teamA');
  const [teamNames, setTeamNames] = useState({ teamA: '', teamB: '' });
  const [editingNames, setEditingNames] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((response) => response.json())
      .then((data) => {
        setMatch(data.match || null);
        if (data.match) {
          setSets(data.match.sets || [defaultSet, defaultSet, defaultSet]);
          setHandCounts({ teamA: data.match.handCounts?.teamA || 0, teamB: data.match.handCounts?.teamB || 0 });
          setServingTeam(data.match.servingTeam || 'teamA');
          setSelectedTeamA(data.match.playingFive?.teamA || '');
          setSelectedTeamB(data.match.playingFive?.teamB || '');
          setSetWinners(data.match.setWinners || [null, null, null]);
          setMatchWinner(data.match.winner || null);
          setTeamNames({ teamA: data.match.teamA, teamB: data.match.teamB });
        }
      });
  }, [matchId]);

  function handleScoreChange(index, team, value) {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [team]: Number(value) };
      return next;
    });
  }

  async function saveMatch() {
    setError('');
    if (!match) return;
    if (!selectedTeamA || !selectedTeamB) {
      setError('Please enter the playing 5 players for each team.');
      return;
    }
    const winner = matchWinner || computeWinner(sets);
    const response = await fetch(`/api/matches/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sets, 
        handCounts, 
        playingFive: { teamA: selectedTeamA, teamB: selectedTeamB }, 
        winner, 
        servingTeam, 
        setWinners,
        teamA: teamNames.teamA,
        teamB: teamNames.teamB
      }),
    });
    if (response.ok) {
      const updated = await response.json();
      setMatch(updated.match);
    }
  }

  if (!match) {
    return <div className="card">Loading match details...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          {editingNames && editable ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input value={teamNames.teamA} onChange={e => setTeamNames({...teamNames, teamA: e.target.value})} style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
              <span style={{ fontSize: '1.5rem' }}>vs</span>
              <input value={teamNames.teamB} onChange={e => setTeamNames({...teamNames, teamB: e.target.value})} style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
              <button onClick={() => setEditingNames(false)}>Done</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1>Match: {teamNames.teamA} vs {teamNames.teamB}</h1>
              {editable && <button className="secondary" onClick={() => setEditingNames(true)}>Edit Names</button>}
            </div>
          )}
          <p className="page-notice">
            Admin can track live score, hand counts, serving rotation, and playing 5 players per team.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/tournaments/${match.tournamentId}`}>
            <button className="secondary">Back to Tournament</button>
          </Link>
          <Link to={`/matches/${match.id}/view`}>
            <button className="secondary">View Live Scores</button>
          </Link>
        </div>
      </div>
      <div className="card">
        <p><strong>Status:</strong> {match.live ? 'Live' : 'Pending'}</p>
        <p><strong>Serving intent:</strong> Each team has 5 turns to serve per set, first to 34 points wins a set.</p>
        <div className="input-group">
          <label>Team A Playing 5</label>
          {editable ? (
            <textarea value={selectedTeamA} onChange={(event) => setSelectedTeamA(event.target.value)} placeholder="Comma-separated player names" rows={2} />
          ) : (
            <p>{selectedTeamA || 'Not specified'}</p>
          )}
        </div>
        <div className="input-group">
          <label>Team B Playing 5</label>
          {editable ? (
            <textarea value={selectedTeamB} onChange={(event) => setSelectedTeamB(event.target.value)} placeholder="Comma-separated player names" rows={2} />
          ) : (
            <p>{selectedTeamB || 'Not specified'}</p>
          )}
        </div>
        <div className="grid-list" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="list-row">
            <h3>Hand count</h3>
            {editable && (
              <div style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
                <button type="button" onClick={() => setHandCounts((prev) => ({ ...prev, teamA: Math.min(prev.teamA + 1, 5) }))}>A +1</button>
                <button type="button" onClick={() => setHandCounts((prev) => ({ ...prev, teamA: Math.max(prev.teamA - 1, 0) }))}>A -1</button>
                <button type="button" onClick={() => setHandCounts((prev) => ({ ...prev, teamB: Math.min(prev.teamB + 1, 5) }))}>B +1</button>
                <button type="button" onClick={() => setHandCounts((prev) => ({ ...prev, teamB: Math.max(prev.teamB - 1, 0) }))}>B -1</button>
              </div>
            )}
            <p>{match.teamA} hands: {handCounts.teamA}/5</p>
            <p>{match.teamB} hands: {handCounts.teamB}/5</p>
            <div style={{ marginTop: '15px' }}>
              <p><strong>Serving:</strong> {servingTeam === 'teamA' ? match.teamA : match.teamB}</p>
              {editable && (
                <div className="inline-group" style={{ marginTop: '5px' }}>
                  <label>Change Serving: </label>
                  <label>
                    <input type="radio" value="teamA" checked={servingTeam === 'teamA'} onChange={(e) => setServingTeam(e.target.value)} /> {match.teamA}
                  </label>
                  <label>
                    <input type="radio" value="teamB" checked={servingTeam === 'teamB'} onChange={(e) => setServingTeam(e.target.value)} /> {match.teamB}
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="list-row">
            <h3>Set summary</h3>
            <div className="table-container">
              <table className="score-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>{match.teamA}</th>
                    <th>{match.teamB}</th>
                    {editable && <th>Set Winner</th>}
                  </tr>
                </thead>
                <tbody>
                  {sets.map((set, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td style={{ backgroundColor: setWinners[index] === 'teamA' ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                        {editable ? (
                          <input type="number" min="0" max="60" value={set.teamA} onChange={(event) => handleScoreChange(index, 'teamA', event.target.value)} />
                        ) : (
                          <span style={{ fontWeight: setWinners[index] === 'teamA' ? 'bold' : 'normal' }}>{set.teamA}</span>
                        )}
                      </td>
                      <td style={{ backgroundColor: setWinners[index] === 'teamB' ? 'rgba(76, 175, 80, 0.1)' : 'transparent' }}>
                        {editable ? (
                          <input type="number" min="0" max="60" value={set.teamB} onChange={(event) => handleScoreChange(index, 'teamB', event.target.value)} />
                        ) : (
                          <span style={{ fontWeight: setWinners[index] === 'teamB' ? 'bold' : 'normal' }}>{set.teamB}</span>
                        )}
                      </td>
                      {editable && (
                        <td>
                          <select value={setWinners[index] || ''} onChange={(e) => setSetWinners(prev => {
                            const next = [...prev];
                            next[index] = e.target.value || null;
                            return next;
                          })}>
                            <option value="">None</option>
                            <option value="teamA">{match.teamA}</option>
                            <option value="teamB">{match.teamB}</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {editable && (
          <div className="input-group" style={{ marginTop: '20px' }}>
            <label><strong>Match Winner:</strong></label>
            <div className="inline-group">
              <label>
                <input type="radio" value="" checked={!matchWinner} onChange={() => setMatchWinner(null)} /> None
              </label>
              <label>
                <input type="radio" value="teamA" checked={matchWinner === 'teamA'} onChange={(e) => setMatchWinner(e.target.value)} /> {match.teamA}
              </label>
              <label>
                <input type="radio" value="teamB" checked={matchWinner === 'teamB'} onChange={(e) => setMatchWinner(e.target.value)} /> {match.teamB}
              </label>
            </div>
          </div>
        )}
        {matchWinner && !editable && (
          <div className="winner-banner" style={{ background: 'var(--accent)', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', marginTop: '20px' }}>
            <h2>🏆 Match Winner: {matchWinner === 'teamA' ? match.teamA : match.teamB} 🏆</h2>
          </div>
        )}
        {editable && (
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="button" onClick={saveMatch}>Save Match Score</button>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
