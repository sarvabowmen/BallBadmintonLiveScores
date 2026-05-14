import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ScoreView() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [handCounts, setHandCounts] = useState({ teamA: 0, teamB: 0 });
  const [sets, setSets] = useState([]);

  const loadMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error('Failed to fetch match');
      const data = await res.json();
      if (data.match) {
        setMatch(data.match);
        setSets(data.match.sets || []);
        setHandCounts({
          teamA: data.match.handCounts?.teamA || 0,
          teamB: data.match.handCounts?.teamB || 0,
        });
      }
    } catch (err) {
      console.error('Error loading match:', err);
    }
  };

  useEffect(() => {
    loadMatch();
    const interval = setInterval(loadMatch, 30000); // 30s
    return () => clearInterval(interval);
  }, [matchId]);

  if (!match) return <div className="card">Loading match details...</div>;

  const servingTeamName = match.servingTeam === 'teamB' ? match.teamB : match.teamA;
  const servingHandCount = match.servingTeam === 'teamB' ? handCounts.teamB : handCounts.teamA;
  const setWinners = match.setWinners || [null, null, null];
  const winner = match.winner || null;

  return (
    <div>
      <div className="page-header">
        <h1>
          {match.teamA} vs {match.teamB}
        </h1>
        <Link to={`/tournaments/${match.tournamentId}`}>
          <button className="secondary">Back to Tournament</button>
        </Link>
      </div>

      <div className="card">
        {winner && (
          <div className="winner-banner" style={{ background: 'var(--accent)', color: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
            <h2>🏆 Match Winner: {winner === 'teamA' ? match.teamA : match.teamB} 🏆</h2>
          </div>
        )}
        
        <p>
          <strong>Status:</strong> {match.live ? 'Live' : (winner ? 'Completed' : 'Pending')}
        </p>
        {!winner && (
          <p>
            <strong>Serving:</strong> <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{servingTeamName}</span> (Hand {servingHandCount}/5)
          </p>
        )}

        <div className="grid-list" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="list-row">
            <h3>Hand count</h3>
            <p>{match.teamA} hands: {handCounts.teamA}/5</p>
            <p>{match.teamB} hands: {handCounts.teamB}/5</p>
          </div>

          <div className="list-row">
            <h3>Set summary</h3>
            <table className="score-table">
              <thead>
                <tr>
                  <th>Set</th>
                  <th>{match.teamA}</th>
                  <th>{match.teamB}</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((set, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ 
                      backgroundColor: setWinners[i] === 'teamA' ? 'rgba(76, 175, 80, 0.15)' : 'transparent',
                      fontWeight: setWinners[i] === 'teamA' ? 'bold' : 'normal'
                    }}>
                      {set.teamA} {setWinners[i] === 'teamA' && '✓'}
                    </td>
                    <td style={{ 
                      backgroundColor: setWinners[i] === 'teamB' ? 'rgba(76, 175, 80, 0.15)' : 'transparent',
                      fontWeight: setWinners[i] === 'teamB' ? 'bold' : 'normal'
                    }}>
                      {set.teamB} {setWinners[i] === 'teamB' && '✓'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {match.playingFive && (
          <div style={{ marginTop: '20px' }}>
             <h3>Playing 5</h3>
             <div className="grid-list" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="list-row">
                   <strong>{match.teamA}:</strong> {match.playingFive.teamA}
                </div>
                <div className="list-row">
                   <strong>{match.teamB}:</strong> {match.playingFive.teamB}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
