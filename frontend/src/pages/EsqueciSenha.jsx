import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';


const TEMPO_ESPERA = 120; // segundos

function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Ao montar o componente, verifica se há cooldown salvo no localStorage
    useEffect(() => {
        const expiracao = localStorage.getItem('redefinicao_expira_em');
        if (expiracao) {
            const tempoRestante = Math.floor((new Date(expiracao) - new Date()) / 1000);
            if (tempoRestante > 0) setCooldown(tempoRestante);
            else localStorage.removeItem('redefinicao_expira_em');
        }
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;

        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    localStorage.removeItem('redefinicao_expira_em');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setMensagem('');
        setCarregando(true);

        try {
            const response = await fetch(`${API_URL}/auth/solicitar-redefinicao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erro ao solicitar redefinição');

            setMensagem('Um e-mail foi enviado com instruções para redefinir sua senha.');

            // Salva a data de expiração no localStorage
            const expiraEm = new Date(Date.now() + TEMPO_ESPERA * 1000);
            localStorage.setItem('redefinicao_expira_em', expiraEm.toISOString());
            setCooldown(TEMPO_ESPERA);
        } catch (err) {
            setErro(err.message || 'Erro inesperado');
        } finally {
            setCarregando(false);
        }
    };

    const formatarTempo = (segundos) => {
        const min = Math.floor(segundos / 60)
            .toString()
            .padStart(2, '0');
        const sec = (segundos % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-8 rounded shadow"
            >
                <h2 className="text-2xl font-bold mb-4 text-center">Recuperar Senha</h2>

                {mensagem && <p className="text-green-600 mb-4 text-center">{mensagem}</p>}
                {erro && <p className="text-red-600 mb-4 text-center">{erro}</p>}

                <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-4 p-3 border rounded"
                    required
                    disabled={cooldown > 0}
                />

                <button
                    type="submit"
                    disabled={carregando || cooldown > 0}
                    className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
                >
                    {carregando
                        ? 'Enviando...'
                        : cooldown > 0
                            ? `Aguarde ${formatarTempo(cooldown)}`
                            : 'Enviar link de redefinição'}
                </button>
            </form>
        </div>
    );
}

export default EsqueciSenha;
