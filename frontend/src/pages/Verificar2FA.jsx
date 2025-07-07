import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../services/api';

function Verificar2FA() {
    const [codigo, setCodigo] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const userId = location.state?.userId;

    const enviandoRef = useRef(false); // ✅ evita envios duplicados simultâneos

    // ✅ Reenvia código
    const enviarCodigo = async () => {
        if (enviandoRef.current) return; // evita chamadas múltiplas simultâneas
        enviandoRef.current = true;

        try {
            const response = await fetch(`${API_URL}/auth/enviar-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao enviar código 2FA');

            const expiraEm = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
            localStorage.setItem('codigo2fa_expira_em', expiraEm.toISOString());
            setCooldown(300);
        } catch (err) {
            console.error('Erro ao reenviar código 2FA:', err.message);
        } finally {
            enviandoRef.current = false;
        }
    };

    // ✅ Envia código ao carregar pela primeira vez
    useEffect(() => {
        if (!userId) return;

        const expiraEm = localStorage.getItem('codigo2fa_expira_em');
        if (expiraEm) {
            const tempoRestante = Math.floor((new Date(expiraEm) - new Date()) / 1000);
            if (tempoRestante > 0) {
                setCooldown(tempoRestante);
                return;
            } else {
                localStorage.removeItem('codigo2fa_expira_em');
            }
        }

        enviarCodigo(); // primeira vez
    }, [userId]);

    // ✅ Cronômetro de cooldown
    useEffect(() => {
        if (cooldown <= 0) return;

        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    localStorage.removeItem('codigo2fa_expira_em');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [cooldown]);

    const formatarTempo = (segundos) => {
        const min = Math.floor(segundos / 60).toString().padStart(2, '0');
        const sec = (segundos % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        try {
            const response = await fetch(`${API_URL}/auth/verificar-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code: codigo }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao verificar código');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                moderatorType: data.user.moderatorType ?? null,
                twoFactorEnabled: true // ✅ garante sincronização visual com o header
            }));

            localStorage.removeItem('codigo2fa_expira_em');
            navigate('/');
        } catch (err) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    };

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">ID do usuário não informado. Faça login novamente.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-8 rounded shadow"
            >
                <h2 className="text-2xl font-bold mb-4 text-center">Verificação em Duas Etapas</h2>
                <p className="text-gray-600 mb-4 text-center">
                    Digite o código enviado para o seu e-mail.
                </p>

                {erro && <p className="text-red-600 mb-4 text-center">{erro}</p>}

                <input
                    type="text"
                    placeholder="Código 2FA"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full mb-4 p-3 border rounded"
                    required
                />

                <button
                    type="submit"
                    disabled={carregando}
                    className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
                >
                    {carregando ? 'Verificando...' : 'Verificar'}
                </button>

                {cooldown > 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-4">
                        Você poderá reenviar o código em {formatarTempo(cooldown)}
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={enviarCodigo}
                        className="text-sm text-blue-600 hover:underline block mx-auto mt-4"
                    >
                        Reenviar código
                    </button>
                )}
            </form>
        </div>
    );
}

export default Verificar2FA;
