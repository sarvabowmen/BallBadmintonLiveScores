import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('bb-admin-token'));

  function logout() {
    localStorage.removeItem('bb-admin-token');
    navigate('/login');
  }

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div>
          <Link to="/tournaments" className="nav-link">
            Ball Badminton Live Scores
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/tournaments" className="nav-link">
            Tournaments
          </Link>
          <Link to="/tournaments/create" className="nav-link">
            Create Tournament
          </Link>
          {isLoggedIn && (
            <button className="secondary" type="button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
