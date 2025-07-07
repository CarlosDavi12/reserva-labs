import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

function validarSenhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(senha);
}

function Cadastro() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');
        setErro('');
        setIsLoading(true);

        if (!validarSenhaForte(password)) {
            setErro('A senha precisa ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e um caractere especial.');
            setIsLoading(false);
            return;
        }

        try {
            await register(name, email, password);
            setMensagem('Cadastro realizado! Verifique seu e-mail para ativar a conta.');
            setName('');
            setEmail('');
            setPassword('');

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setErro(err.message || 'Erro ao cadastrar usuário.');
        } finally {
            setIsLoading(false);
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
                    className="w-full mb-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <small className="text-xs text-gray-500 block mb-4">
                    A senha deve conter pelo menos 8 caracteres, com letras maiúsculas, minúsculas, números e um caractere especial.
                </small>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full bg-black text-white py-2 rounded transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                        }`}
                >
                    {isLoading ? 'Enviando...' : 'Cadastrar'}
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
