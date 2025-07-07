import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [alterando2FA, setAlterando2FA] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const traduzirPapel = (role, moderatorType) => {
        if (role === 'ADMIN') return 'Administrador';
        if (role === 'MODERATOR') {
            return moderatorType?.toUpperCase() === 'COORDINATOR' ? 'Coordenador' : 'Monitor';
        }
        return 'Solicitante';
    };

    const handleToggle2FA = async () => {
        if (!user) return;
        setAlterando2FA(true);

        try {
            const response = await fetch('http://localhost:3333/auth/atualizar-2fa', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ habilitar: !user.twoFactorEnabled }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao atualizar 2FA');

            const updatedUser = {
                ...user,
                twoFactorEnabled: data.twoFactorEnabled,
            };

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert(err.message);
        } finally {
            setAlterando2FA(false);
        }
    };

    return (
        <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center border-b">
            <div className="text-xl font-semibold text-gray-800">
                <Link to="/">ReservaLab</Link>
            </div>

            {user && (
                <nav className="flex items-center gap-4 text-sm font-medium">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded-md ${isActive('/') ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-600'}`}
                    >
                        Dashboard
                    </Link>

                    <Link
                        to="/minhas-reservas"
                        className={`px-3 py-2 rounded-md ${isActive('/minhas-reservas') ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-600'}`}
                    >
                        Minhas Reservas
                    </Link>

                    {user.role === 'MODERATOR' && (
                        <Link
                            to="/painel"
                            className={`px-3 py-2 rounded-md ${isActive('/painel') ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-600'}`}
                        >
                            {user.moderatorType?.toUpperCase() === 'COORDINATOR'
                                ? 'Painel do Coordenador'
                                : 'Painel do Monitor'}
                        </Link>
                    )}

                    {user.role === 'ADMIN' && (
                        <Link
                            to="/painel-admin"
                            className={`px-3 py-2 rounded-md ${isActive('/painel-admin') ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-600'}`}
                        >
                            Painel do Administrador
                        </Link>
                    )}

                    {/* ✅ Botão 2FA discreto com ícone */}
                    <button
                        onClick={handleToggle2FA}
                        disabled={alterando2FA}
                        title={user.twoFactorEnabled ? '2FA ativado. Clique para desativar' : '2FA desativado. Clique para ativar'}
                        className={`text-lg ml-2 ${user.twoFactorEnabled ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'} transition`}
                    >
                        {user.twoFactorEnabled ? '🔒' : '🔓'}
                    </button>

                    {/* Usuário + papel + logout */}
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-700 font-semibold">
                            {user.name}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full uppercase">
                            {traduzirPapel(user.role, user.moderatorType)}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="ml-2 flex items-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition"
                            title="Sair"
                        >
                            ⎋ <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </nav>
            )}

            {!user && (
                <nav className="flex gap-4 text-sm text-gray-600">
                    <Link to="/login" className="hover:text-black">Login</Link>
                    <Link to="/cadastro" className="hover:text-black">Cadastro</Link>
                </nav>
            )}
        </header>
    );
}

export default Header;
