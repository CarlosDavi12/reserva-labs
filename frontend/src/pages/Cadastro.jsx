import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

function Cadastro() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');
        setErro('');

        try {
            await register(name, email, password);
            setMensagem('Usuário cadastrado com sucesso! Redirecionando...');
            setName('');
            setEmail('');
            setPassword('');

            // Redireciona após 2 segundos
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setErro(err.message || 'Erro ao cadastrar usuário.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
            >
                <h2 className="text-2xl font-bold mb-2 text-center">
                    Criar uma nova conta
                </h2>
                <p className="text-gray-500 mb-6 text-center">
                    Preencha os campos para se cadastrar
                </p>

                {mensagem && (
                    <p className="text-green-600 text-sm mb-4 text-center">{mensagem}</p>
                )}
                {erro && (
                    <p className="text-red-600 text-sm mb-4 text-center">{erro}</p>
                )}

                <input
                    type="text"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mb-3 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

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
                    Cadastrar
                </button>

                <a
                    href="/login"
                    className="text-blue-600 hover:underline text-sm block mt-4 text-center"
                >
                    Já tem uma conta? Faça login
                </a>
            </form>
        </div>
    );
}

export default Cadastro;
