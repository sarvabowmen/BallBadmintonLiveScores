import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((response) => response.json())
      .then((data) => {
        setTournaments(data.tournaments || []);
      })
      .catch(() => {
        setTournaments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = Boolean(localStorage.getItem('bb-admin-token'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Tournaments</h1>
          <p className="page-notice">
            Track live ball badminton scores, view schedules, and manage tournaments.
          </p>
        </div>
        {isAdmin && (
          <Link to="/tournaments/create">
            <button>Create Tournament</button>
          </Link>
        )}
      </div>
      {loading ? (
        <div className="card">Loading...</div>
      ) : tournaments.length === 0 ? (
        <div className="card">No tournaments found. Create one to begin.</div>
      ) : (
        <div className="grid-list">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="list-row">
              <h3>{tournament.name}</h3>
              <p>{tournament.location || 'No location specified'}</p>
              <div className="inline-group">
                <small>{new Date(tournament.startDate).toLocaleDateString()}</small>
                <Link to={`/tournaments/${tournament.id}`} className="nav-link">
                  View schedule
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
