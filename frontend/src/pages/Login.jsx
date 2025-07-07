import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import ReCAPTCHA from 'react-google-recaptcha';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro] = useState('');
    const [tentativasFalhas, setTentativasFalhas] = useState(0);
    const [executandoRecaptcha, setExecutandoRecaptcha] = useState(false);
    const recaptchaRef = useRef(null);
    const recaptchaLogEnviado = useRef(false); // ✅ Evita logs duplicados
    const navigate = useNavigate();

    const SITE_KEY = '6LdwTXorAAAAAKQkf9ywcXskGc42qjOU4T4Zkvh-';

    const realizarLogin = async (recaptchaToken = null) => {
        try {
            const response = await login(email, password, recaptchaToken);

            if (response.user.twoFactorEnabled) {
                navigate('/verificar-2fa', { state: { userId: response.user.id } });
                return;
            }

            localStorage.setItem('token', response.token);
            localStorage.setItem(
                'user',
                JSON.stringify({
                    id: response.user.id,
                    name: response.user.name,
                    role: response.user.role,
                    moderatorType: response.user.moderatorType ?? null,
                    twoFactorEnabled: false,
                })
            );

            window.location.href = '/';
        } catch (err) {
            setErro(err.message || 'Erro ao fazer login');
            setTentativasFalhas((prev) => {
                const novoValor = prev + 1;

                if (novoValor === 3 && !recaptchaLogEnviado.current) {
                    recaptchaLogEnviado.current = true; // ✅ Garante envio único
                    fetch('http://localhost:3333/logs/recaptcha-visivel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                    }).catch((error) => {
                        console.warn('❗ Falha ao registrar log de reCAPTCHA visível:', error.message);
                    });
                }

                return novoValor;
            });

            setExecutandoRecaptcha(false);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        if (tentativasFalhas >= 3) {
            if (recaptchaRef.current) {
                setExecutandoRecaptcha(true);
                await recaptchaRef.current.executeAsync();
                return;
            }
        }

        await realizarLogin(); // sem reCAPTCHA
    };

    const onReCAPTCHAChange = (token) => {
        if (!token) {
            setErro('Falha ao validar o reCAPTCHA.');
            setExecutandoRecaptcha(false);
            return;
        }

        realizarLogin(token);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                autoComplete="on"
                className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
            >
                <h2 className="text-2xl font-bold mb-2 text-center">ReservaLab</h2>
                <p className="text-gray-500 mb-6 text-center">
                    Faça login para acessar o sistema
                </p>

                {erro && <p className="text-red-600 text-sm mb-3 text-center">{erro}</p>}

                <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                />

                <button
                    type="submit"
                    disabled={executandoRecaptcha}
                    className={`w-full py-2 rounded transition ${executandoRecaptcha ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:opacity-90'}`}
                >
                    {executandoRecaptcha ? 'Verificando...' : 'Entrar'}
                </button>

                <a
                    href="/esqueci-senha"
                    className="text-blue-600 hover:underline text-sm block mt-2 text-center"
                >
                    Esqueceu sua senha?
                </a>

                <a
                    href="/cadastro"
                    className="text-blue-600 hover:underline text-sm block mt-4 text-center"
                >
                    Não tem uma conta? Cadastre-se
                </a>

                {tentativasFalhas >= 3 && (
                    <ReCAPTCHA
                        sitekey={SITE_KEY}
                        size="invisible"
                        ref={recaptchaRef}
                        onChange={onReCAPTCHAChange}
                    />
                )}
            </form>
        </div>
    );
}

export default Login;
