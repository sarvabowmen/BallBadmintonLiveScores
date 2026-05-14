import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function TournamentDetails() {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editForm, setEditForm] = useState({ teamA: '', teamB: '', round: '', date: '', time: '' });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tournaments/${tournamentId}`)
      .then((response) => response.json())
      .then((data) => {
        setTournament(data.tournament || null);
        setMatches(data.matches || []);
      })
      .catch(() => {
        setTournament(null);
      })
      .finally(() => setLoading(false));
  }, [tournamentId]);

  function startEdit(match) {
    setEditingMatchId(match.id);
    setEditForm({ teamA: match.teamA, teamB: match.teamB, round: match.round, date: match.date, time: match.time });
  }

  async function saveEdit(matchId) {
    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (response.ok) {
      const updated = await response.json();
      setMatches((prev) => prev.map((match) => (match.id === matchId ? updated.match : match)));
      setEditingMatchId(null);
    }
  }

  async function toggleLive(matchId, currentState) {
    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live: !currentState }),
    });
    if (response.ok) {
      const updated = await response.json();
      setMatches((prev) => prev.map((match) => (match.id === matchId ? updated.match : match)));
    }
  }

  const isAdmin = Boolean(localStorage.getItem('bb-admin-token'));

  if (loading) {
    return <div className="card">Loading schedule...</div>;
  }

  if (!tournament) {
    return <div className="card">Tournament not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{tournament.name}</h1>
          <p className="page-notice">
            View fixtures, live scores, and results for this ball badminton tournament.
          </p>
        </div>
        {isAdmin && (
          <Link to="/tournaments/create">
            <button>Create Another Tournament</button>
          </Link>
        )}
      </div>
      <div className="card">
        <div className="inline-group" style={{ marginBottom: 16 }}>
          <strong>Location:</strong> {tournament.location || 'N/A'}
          <strong>Start date:</strong> {new Date(tournament.startDate).toLocaleDateString()}
        </div>
        {matches.length === 0 ? (
          <p>No fixtures uploaded for this tournament.</p>
        ) : (
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Match</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
               {matches.map((match) => (
                <tr key={match.id}>
                  {editingMatchId === match.id ? (
                    <>
                      <td><input value={editForm.round} onChange={e => setEditForm({ ...editForm, round: e.target.value })} style={{ width: '80px' }} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input value={editForm.teamA} onChange={e => setEditForm({ ...editForm, teamA: e.target.value })} />
                          <span>vs</span>
                          <input value={editForm.teamB} onChange={e => setEditForm({ ...editForm, teamB: e.target.value })} />
                        </div>
                      </td>
                      <td><input value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ width: '100px' }} /></td>
                      <td><input value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={{ width: '80px' }} /></td>
                      <td>-</td>
                      <td className="inline-group">
                        <button type="button" onClick={() => saveEdit(match.id)}>Save</button>
                        <button type="button" className="secondary" onClick={() => setEditingMatchId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{match.round}</td>
                      <td>{match.teamA} vs {match.teamB}</td>
                      <td>{match.date}</td>
                      <td>{match.time}</td>
                      <td>
                        <span className={`status-chip ${match.live ? 'live' : 'pending'}`}>
                          {match.live ? 'Live' : 'Pending'}
                        </span>
                      </td>
                      <td className="inline-group">
                        {isAdmin && (
                          <>
                            <button type="button" onClick={() => toggleLive(match.id, match.live)}>
                              {match.live ? 'Stop' : 'Mark Live'}
                            </button>
                            <button type="button" className="secondary" onClick={() => startEdit(match)}>Edit</button>
                            <Link to={`/matches/${match.id}/live`} className="nav-link">
                              Score
                            </Link>
                          </>
                        )}
                        {match.live ? (
                          <Link to={`/matches/${match.id}/view`} className="nav-link" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                            View Score
                          </Link>
                        ) : (
                          <Link to={`/matches/${match.id}`} className="nav-link">
                            Details
                          </Link>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
