import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ScorerPage from './pages/ScorerPage';
import LoginPage from './pages/LoginPage';
import PublicProfilePage from './pages/PublicProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scorer" element={<ScorerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/u/:handle" element={<PublicProfilePage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}