import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ScorerPage from './pages/ScorerPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scorer" element={<ScorerPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}