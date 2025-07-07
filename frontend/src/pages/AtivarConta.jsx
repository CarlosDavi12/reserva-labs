import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function AtivarConta() {
    const query = useQuery();
    const token = query.get('token');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');

    const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

    useEffect(() => {
        async function ativar() {
            if (!token) {
                setErro('Token não informado.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/ativar-conta?token=${token}`);
                const data = await response.json();

                if (!response.ok) {
                    if (!mensagem) {
                        setErro(data.error || 'Token inválido ou expirado.');
                    }
                    return;
                }

                setMensagem(data.message || 'Conta ativada com sucesso!');
                setErro('');

                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } catch (err) {
                if (!mensagem) {
                    setErro('Erro inesperado ao ativar a conta.');
                }
            }
        }

        ativar();
    }, [token, mensagem, API_URL]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded shadow">
                <h1 className="text-2xl font-bold mb-4 text-center">Ativação de Conta</h1>
                {mensagem && (
                    <p className="text-green-600 text-center">{mensagem}</p>
                )}
                {erro && !mensagem && (
                    <p className="text-red-600 text-center">{erro}</p>
                )}
            </div>
        </div>
    );
}

export default AtivarConta;
