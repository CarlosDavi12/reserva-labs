import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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

                    {(user.role === 'MODERATOR' || user.role === 'ADMIN') && (
                        <Link
                            to="/painel"
                            className={`px-3 py-2 rounded-md ${isActive('/painel') ? 'bg-blue-100 text-blue-700' : 'hover:text-gray-900 text-gray-600'}`}
                        >
                            Painel do Moderador
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

                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-700 font-semibold">
                            {user.name}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full uppercase">
                            {user.role}
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
