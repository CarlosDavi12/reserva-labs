import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MinhasReservas from './pages/MinhasReservas';
import PainelModerador from './pages/PainelModerador';
import Cadastro from './pages/Cadastro';
import PainelAdmin from './pages/PainelAdmin';
import NotFound from './pages/NotFound';
import DefinirSenha from './pages/DefinirSenha';
import AtivarConta from './pages/AtivarConta';

function ProtectedRouteModerador({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ProtectedRouteAdmin({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ProtectedRouteUser({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Público */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/definir-senha" element={<DefinirSenha />} />
        <Route path="/ativar-conta" element={<AtivarConta />} /> {/* ✅ Correção aplicada */}

        {/* Protegidas */}
        <Route path="/" element={<ProtectedRouteUser><Dashboard /></ProtectedRouteUser>} />
        <Route path="/minhas-reservas" element={<ProtectedRouteUser><MinhasReservas /></ProtectedRouteUser>} />
        <Route path="/painel" element={<ProtectedRouteModerador><PainelModerador /></ProtectedRouteModerador>} />
        <Route path="/painel-admin" element={<ProtectedRouteAdmin><PainelAdmin /></ProtectedRouteAdmin>} />

        {/* Rota inexistente */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
