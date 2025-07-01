import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function DefinirSenha() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!token) {
            setErro('Token de redefinição não fornecido.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setMensagem('');

        if (novaSenha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3333/auth/definir-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erro ao definir senha');

            setMensagem('Senha definida com sucesso. Redirecionando...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded shadow">
                <h2 className="text-2xl font-bold mb-4 text-center">Definir Nova Senha</h2>

                {mensagem && <p className="text-green-600 mb-4 text-center">{mensagem}</p>}
                {erro && <p className="text-red-600 mb-4 text-center">{erro}</p>}

                <input
                    type="password"
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full mb-3 p-3 border rounded"
                    required
                />

                <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full mb-4 p-3 border rounded"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-black text-white py-2 rounded hover:opacity-90"
                >
                    Definir Senha
                </button>
            </form>
        </div>
    );
}

export default DefinirSenha;
