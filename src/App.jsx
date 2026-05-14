import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Tournaments from './pages/Tournaments.jsx';
import CreateTournament from './pages/CreateTournament.jsx';
import TournamentDetails from './pages/TournamentDetails.jsx';
import MatchDetails from './pages/MatchDetails.jsx';
import LiveScoring from './pages/LiveScoring.jsx';
import ScoreView from './pages/ScoreView.jsx';
import Navbar from './components/Navbar.jsx';

function requireAuth() {
  return Boolean(localStorage.getItem('bb-admin-token'));
}

function ProtectedRoute({ children }) {
  return requireAuth() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Tournaments />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route
            path="/tournaments/create"
            element={
              <ProtectedRoute>
                <CreateTournament />
              </ProtectedRoute>
            }
          />
          <Route path="/tournaments/:tournamentId" element={<TournamentDetails />} />
          <Route path="/matches/:matchId" element={<MatchDetails />} />
          <Route
            path="/matches/:matchId/live"
            element={
              <ProtectedRoute>
                <LiveScoring />
              </ProtectedRoute>
            }
          />
          <Route path="/matches/:matchId/view" element={<ScoreView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
