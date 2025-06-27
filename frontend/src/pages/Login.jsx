import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const response = await login(email, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = '/';
        } catch (err) {
            setErro(err.message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
            >
                <h2 className="text-2xl font-bold mb-2 text-center">
                    ReservaLab
                </h2>
                <p className="text-gray-500 mb-6 text-center">
                    Faça login para acessar o sistema
                </p>

                {erro && <p className="text-red-600 text-sm mb-3 text-center">{erro}</p>}

                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
                >
                    Entrar
                </button>

                <a
                    href="/cadastro"
                    className="text-blue-600 hover:underline text-sm block mt-4 text-center"
                >
                    Não tem uma conta? Cadastre-se
                </a>
            </form>
        </div>
    );
}

export default Login;
