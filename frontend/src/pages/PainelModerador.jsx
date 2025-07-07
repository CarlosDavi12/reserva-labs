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
import ModalModerador from '../components/ModalModerador';

function PainelModerador() {
    const [user, setUser] = useState(null);
    const [labs, setLabs] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [novoMonitorPorLab, setNovoMonitorPorLab] = useState({});
    const [loadingLabId, setLoadingLabId] = useState(null);
    const [filtroLab, setFiltroLab] = useState('');
    const [labSelecionado, setLabSelecionado] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);

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

            const usuariosData = await listarUsuariosPermitidosParaCoordenador();
            setUsuarios(usuariosData);

            const reservasData = await getReservationsByModerator();
            setReservas(reservasData);
        } catch (err) {
            setErro('Erro ao carregar dados.');
        }
    };

    const formatarDataHora = (start, end) => {
        const data = new Date(start).toLocaleDateString('pt-BR');
        const horaInicio = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const horaFim = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${data} • ${horaInicio} — ${horaFim}`;
    };

    const formatarDataCriacao = (createdAt) => {
        return new Date(createdAt).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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

    const handleRemoverVinculo = async (labId, userId, userType) => {
        if (user?.moderatorType === 'COORDINATOR' && userType === 'COORDINATOR') {
            setErro('Coordenadores não podem remover outros coordenadores.');
            return;
        }
        if (user?.moderatorType === 'MONITOR') {
            setErro('Monitores não têm permissão para remover usuários.');
            return;
        }

        try {
            await removerUsuarioDoLab(labId, userId);
            setMensagem('Usuário removido com sucesso!');
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

    const abrirModalLaboratorio = (lab) => {
        setLabSelecionado(lab);
        setModalAberto(true);
    };

    const labsFiltrados = labs.filter(lab =>
        lab.name.toLowerCase().includes(filtroLab.toLowerCase())
    );

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
                    <>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Filtrar laboratórios por nome..."
                                value={filtroLab}
                                onChange={(e) => setFiltroLab(e.target.value)}
                                className="border px-3 py-2 rounded w-full max-w-md"
                            />
                        </div>

                        <div className="space-y-4">
                            {labsFiltrados.map((lab) => {
                                const moderadoresDoLab = usuarios.filter(
                                    (u) => u.role === 'MODERATOR' && u.moderatorLabs?.some((ml) => ml.labId === lab.id)
                                );
                                const monitoresCount = moderadoresDoLab.filter(m => m.moderatorType === 'MONITOR').length;
                                const coordenadoresCount = moderadoresDoLab.filter(m => m.moderatorType === 'COORDINATOR').length;

                                return (
                                    <div key={lab.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl font-semibold">{lab.name}</h2>
                                                {lab.description && (
                                                    <p className="text-sm text-gray-600 break-words whitespace-pre-wrap mt-1">
                                                        {lab.description.length > 150
                                                            ? `${lab.description.substring(0, 150)}...`
                                                            : lab.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-shrink-0 items-center gap-2">
                                                {coordenadoresCount > 0 && (
                                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                        {coordenadoresCount} coord.
                                                    </span>
                                                )}
                                                {monitoresCount > 0 && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                        {monitoresCount} monit.
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => abrirModalLaboratorio(lab)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                                                >
                                                    Gerenciar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Gerenciamento do Laboratório */}
            {modalAberto && labSelecionado && (
                <ModalModerador onClose={() => setModalAberto(false)} titulo={`Gerenciar ${labSelecionado.name}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {user?.moderatorType === 'COORDINATOR' && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold mb-3">Cadastrar novo monitor</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Nome completo"
                                            value={novoMonitorPorLab[labSelecionado.id]?.name || ''}
                                            onChange={(e) => handleInputChange(labSelecionado.id, 'name', e.target.value)}
                                            className="border px-3 py-2 rounded w-full"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email institucional"
                                            value={novoMonitorPorLab[labSelecionado.id]?.email || ''}
                                            onChange={(e) => handleInputChange(labSelecionado.id, 'email', e.target.value)}
                                            className="border px-3 py-2 rounded w-full"
                                        />
                                        <button
                                            onClick={() => handleCadastroMonitor(labSelecionado.id)}
                                            disabled={loadingLabId === labSelecionado.id}
                                            className={`py-2 rounded text-white transition w-full ${loadingLabId === labSelecionado.id
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-black hover:bg-gray-800'
                                                }`}
                                        >
                                            {loadingLabId === labSelecionado.id ? 'Enviando...' : 'Cadastrar Monitor'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <AgendaLaboratorio
                                reservas={reservas.filter(r => r.labId === labSelecionado.id && r.status === 'APPROVED')}
                            />

                            {/* Seção de Coordenadores Vinculados */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">Coordenadores vinculados</h3>
                                <ul className="space-y-2">
                                    {usuarios
                                        .filter(u => u.role === 'MODERATOR' &&
                                            u.moderatorType === 'COORDINATOR' &&
                                            u.moderatorLabs?.some(ml => ml.labId === labSelecionado.id))
                                        .map((u) => (
                                            <li key={u.id} className="flex justify-between items-center bg-white border px-4 py-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{u.name}</p>
                                                    <p className="text-sm text-gray-600">{u.email}</p>
                                                    <span className={`text-xs mt-1 ${u.password ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {u.password ? '(Ativo)' : '(Aguardando ativação)'}
                                                    </span>
                                                </div>
                                                {/* INÍCIO DA MUDANÇA: REMOÇÃO DO BOTÃO DE LIXEIRA PARA COORDENADORES */}
                                                {user?.moderatorType === 'COORDINATOR' && user.id === u.id && (
                                                    <span className="text-sm text-gray-500 italic">Você</span>
                                                )}
                                                {/* FIM DA MUDANÇA: O botão de exclusão para outros coordenadores foi removido aqui */}
                                            </li>
                                        ))}
                                    {usuarios.filter(u => u.role === 'MODERATOR' &&
                                        u.moderatorType === 'COORDINATOR' &&
                                        u.moderatorLabs?.some(ml => ml.labId === labSelecionado.id)).length === 0 && (
                                            <li className="text-center py-4 text-gray-500">
                                                Nenhum coordenador vinculado
                                            </li>
                                        )}
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">Monitores vinculados</h3>
                                <ul className="space-y-2">
                                    {usuarios
                                        .filter(u => u.role === 'MODERATOR' &&
                                            u.moderatorType === 'MONITOR' &&
                                            u.moderatorLabs?.some(ml => ml.labId === labSelecionado.id))
                                        .map((u) => (
                                            <li key={u.id} className="flex justify-between items-center bg-white border px-4 py-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{u.name}</p>
                                                    <p className="text-sm text-gray-600">{u.email}</p>
                                                    <span className={`text-xs mt-1 ${u.password ? 'text-green-600' : 'text-yellow-600'
                                                        }`}>
                                                        {u.password ? '(Ativo)' : '(Aguardando ativação)'}
                                                    </span>
                                                </div>
                                                {user?.moderatorType === 'COORDINATOR' && (
                                                    <button
                                                        onClick={() => handleRemoverVinculo(labSelecionado.id, u.id, 'MONITOR')}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Remover monitor"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    {usuarios.filter(u => u.role === 'MODERATOR' &&
                                        u.moderatorType === 'MONITOR' &&
                                        u.moderatorLabs?.some(ml => ml.labId === labSelecionado.id)).length === 0 && (
                                            <li className="text-center py-4 text-gray-500">
                                                Nenhum monitor vinculado
                                            </li>
                                        )}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                <div key={status} className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold mb-3">
                                        {status === 'PENDING' ? 'Reservas Pendentes' :
                                            status === 'APPROVED' ? 'Reservas Aprovadas' : 'Reservas Rejeitadas'}
                                    </h3>

                                    <ul className="space-y-3">
                                        {reservasPorStatus(labSelecionado.id, status)
                                            .sort((a, b) => new Date(b.start) - new Date(a.start))
                                            .slice(0, status !== 'PENDING' ? 5 : reservas.length)
                                            .map((r) => (
                                                <li key={r.id} className="bg-white border rounded-lg p-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">{r.user.name}</p>
                                                                <p className="text-sm text-gray-600">{formatarDataHora(r.start, r.end)}</p>
                                                            </div>
                                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                                r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {r.status}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-gray-500">
                                                            Solicitada em: {formatarDataCriacao(r.createdAt)}
                                                        </p>

                                                        {(status === 'APPROVED' || status === 'REJECTED') && r.updatedBy && (
                                                            <p className="text-xs text-gray-500">
                                                                {status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'} por: {r.updatedBy.name}
                                                                ({r.updatedBy.moderatorType === 'COORDINATOR' ? 'Coordenador' : 'Monitor'})
                                                            </p>
                                                        )}

                                                        {status === 'PENDING' && (
                                                            <div className="flex gap-2 pt-2">
                                                                <button
                                                                    onClick={() => handleStatusReserva(r.id, 'APPROVED')}
                                                                    className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
                                                                >
                                                                    Aprovar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusReserva(r.id, 'REJECTED')}
                                                                    className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
                                                                >
                                                                    Rejeitar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}

                                        {reservasPorStatus(labSelecionado.id, status).length === 0 && (
                                            <li className="text-center py-4 text-gray-500">
                                                Nenhuma reserva {status === 'PENDING' ? 'pendente' :
                                                    status === 'APPROVED' ? 'aprovada' : 'rejeitada'}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalModerador>
            )}

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