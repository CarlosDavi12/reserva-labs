import { useEffect, useState } from 'react';
import {
    getMyLabs,
    cadastrarUsuario,
    atribuirUsuarioAoLab,
    removerUsuarioDoLab,
    listarUsuariosPermitidosParaCoordenador,
    getReservationsByModerator,
    updateReservationStatus
} from '../services/api';
import Header from '../components/Header';
import AgendaLaboratorio from '../components/AgendaLaboratorio';

function PainelModerador() {
    const [user, setUser] = useState(null);
    const [labs, setLabs] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [novoMonitorPorLab, setNovoMonitorPorLab] = useState({});
    const [loadingLabId, setLoadingLabId] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        if (user) {
            carregarDados();
        }
    }, [user]);

    useEffect(() => {
        if (mensagem || erro) {
            const timer = setTimeout(() => {
                setMensagem('');
                setErro('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mensagem, erro]);

    const carregarDados = async () => {
        try {
            const labsData = await getMyLabs();
            setLabs(labsData);

            if (user?.moderatorType === 'COORDINATOR') {
                const usuariosData = await listarUsuariosPermitidosParaCoordenador();
                setUsuarios(usuariosData);
            }

            const reservasData = await getReservationsByModerator();
            setReservas(reservasData);
        } catch (err) {
            setErro('Erro ao carregar dados.');
        }
    };

    const handleInputChange = (labId, field, value) => {
        setNovoMonitorPorLab((prev) => ({
            ...prev,
            [labId]: {
                ...prev[labId],
                [field]: value
            }
        }));
    };

    const handleCadastroMonitor = async (labId) => {
        const { name, email } = novoMonitorPorLab[labId] || {};
        if (!name || !email) {
            setErro('Preencha nome e email.');
            return;
        }

        setErro('');
        setMensagem('');
        setLoadingLabId(labId);

        try {
            const payload = {
                name,
                email,
                role: 'MODERATOR',
                moderatorType: 'MONITOR'
            };

            const novoUsuario = await cadastrarUsuario(payload);
            await atribuirUsuarioAoLab(labId, novoUsuario.user.id);
            setMensagem('Monitor cadastrado e vinculado com sucesso!');
            setNovoMonitorPorLab((prev) => ({ ...prev, [labId]: { name: '', email: '' } }));
            await carregarDados();
        } catch (err) {
            setErro(err.message || 'Erro ao cadastrar monitor.');
        } finally {
            setLoadingLabId(null);
        }
    };

    const handleRemoverVinculo = async (labId, userId) => {
        try {
            await removerUsuarioDoLab(labId, userId);
            setMensagem('Monitor removido com sucesso!');
            await carregarDados();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleStatusReserva = async (reservaId, status) => {
        try {
            await updateReservationStatus(reservaId, status);
            setMensagem(`Reserva ${status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            await carregarDados();
        } catch (err) {
            setErro(err.message);
        }
    };

    const reservasPorStatus = (labId, status) =>
        reservas.filter((r) => r.labId === labId && r.status === status);

    return (
        <>
            <Header />
            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">
                    {user?.moderatorType === 'COORDINATOR' ? 'Painel do Coordenador' : 'Painel do Monitor'}
                </h1>

                {labs.length === 0 ? (
                    <div className="text-center mt-20 text-gray-500">
                        <p className="text-lg">Você ainda não está vinculado a nenhum laboratório.</p>
                        <p className="text-sm">Aguarde um coordenador ou administrador realizar a vinculação.</p>
                    </div>
                ) : (
                    <ul className="space-y-6">
                        {labs.map((lab) => (
                            <li key={lab.id} className="bg-white border rounded-lg p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-2">{lab.name}</h2>
                                {lab.description && <p className="text-sm text-gray-600 mb-4">{lab.description}</p>}

                                {user?.moderatorType === 'COORDINATOR' && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold mb-2">Cadastrar novo monitor</h3>
                                        <div className="grid md:grid-cols-3 gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Nome"
                                                value={novoMonitorPorLab[lab.id]?.name || ''}
                                                onChange={(e) => handleInputChange(lab.id, 'name', e.target.value)}
                                                className="border px-3 py-2 rounded"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={novoMonitorPorLab[lab.id]?.email || ''}
                                                onChange={(e) => handleInputChange(lab.id, 'email', e.target.value)}
                                                className="border px-3 py-2 rounded"
                                            />
                                            <button
                                                onClick={() => handleCadastroMonitor(lab.id)}
                                                disabled={loadingLabId === lab.id}
                                                className={`py-2 rounded text-white transition ${loadingLabId === lab.id
                                                    ? 'bg-gray-500 cursor-not-allowed'
                                                    : 'bg-black hover:bg-gray-800'
                                                    }`}
                                            >
                                                {loadingLabId === lab.id ? 'Enviando...' : 'Cadastrar'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <AgendaLaboratorio
                                    reservas={reservas.filter(r => r.labId === lab.id && r.status === 'APPROVED')}
                                />

                                {user?.moderatorType === 'COORDINATOR' && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-semibold mb-2">Monitores vinculados</h3>
                                        <ul className="space-y-2">
                                            {usuarios
                                                .filter(
                                                    (u) =>
                                                        u.role === 'MODERATOR' &&
                                                        u.moderatorType === 'MONITOR' &&
                                                        u.moderatorLabs?.some((ml) => ml.labId === lab.id)
                                                )
                                                .map((u) => (
                                                    <li
                                                        key={u.id}
                                                        className="flex justify-between items-center border px-3 py-2 rounded text-sm"
                                                    >
                                                        <span>
                                                            {u.name} ({u.email}){' '}
                                                            {u.password
                                                                ? <span className="text-green-600 text-xs">(Ativo)</span>
                                                                : <span className="text-yellow-600 text-xs">(Aguardando ativação)</span>}
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoverVinculo(lab.id, u.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Remover"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </li>
                                                ))}
                                            {usuarios.filter(
                                                (u) =>
                                                    u.role === 'MODERATOR' &&
                                                    u.moderatorType === 'MONITOR' &&
                                                    u.moderatorLabs?.some((ml) => ml.labId === lab.id)
                                            ).length === 0 && (
                                                    <li className="text-sm text-gray-500">Nenhum monitor vinculado ainda.</li>
                                                )}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-6 space-y-4">
                                    {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                        <div key={status}>
                                            <h3 className="text-sm font-semibold mb-2">
                                                {status === 'PENDING' && 'Reservas Pendentes'}
                                                {status === 'APPROVED' && 'Reservas Aprovadas'}
                                                {status === 'REJECTED' && 'Reservas Rejeitadas'}
                                            </h3>
                                            <ul className="space-y-2">
                                                {reservasPorStatus(lab.id, status).map((r) => (
                                                    <li
                                                        key={r.id}
                                                        className="border rounded p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                                                    >
                                                        <div>
                                                            <p><strong>Usuário:</strong> {r.user.name}</p>
                                                            <p><strong>Início:</strong> {new Date(r.start).toLocaleString()}</p>
                                                            <p><strong>Fim:</strong> {new Date(r.end).toLocaleString()}</p>
                                                            <p><strong>Status:</strong> {r.status}</p>
                                                        </div>
                                                        {status === 'PENDING' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleStatusReserva(r.id, 'APPROVED')}
                                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                                                >
                                                                    Aprovar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusReserva(r.id, 'REJECTED')}
                                                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                                                >
                                                                    Rejeitar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                                {reservasPorStatus(lab.id, status).length === 0 && (
                                                    <li className="text-sm text-gray-500">Nenhuma reserva {status === 'PENDING' ? 'pendente' : status === 'APPROVED' ? 'aprovada' : 'rejeitada'}.</li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Toast flutuante */}
            {(mensagem || erro) && (
                <div className="fixed bottom-6 right-6 z-50">
                    <div className={`px-4 py-2 rounded shadow-md text-white transition-all duration-300
                        ${erro ? 'bg-red-600' : 'bg-green-600'}`}>
                        {erro || mensagem}
                    </div>
                </div>
            )}
        </>
    );
}

export default PainelModerador;
