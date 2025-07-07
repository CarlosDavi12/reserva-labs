import { useEffect, useState } from 'react';
import {
    getLabs,
    deletarLaboratorio,
    listarUsuarios,
    cadastrarUsuario,
    atribuirUsuarioAoLab,
    removerUsuarioDoLab,
} from '../services/api';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { API_URL } from '../services/api';

function formatarTextoDoLog(texto) {
    if (typeof texto !== 'string') return texto;

    const regexISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;
    return texto.replace(regexISO, (dataIso) => {
        const data = new Date(dataIso);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
}

function PainelAdmin() {
    const [abaAtiva, setAbaAtiva] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [logsAuditoria, setLogsAuditoria] = useState([]);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [novoLab, setNovoLab] = useState({ name: '', description: '', image: null });
    const [novoUsuario, setNovoUsuario] = useState({ name: '', email: '', role: 'MODERATOR-COORDINATOR' });
    const [vinculos, setVinculos] = useState({});
    const [loading, setLoading] = useState(false);
    const [labSelecionado, setLabSelecionado] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [filtroLab, setFiltroLab] = useState('');
    const [filtroUsuario, setFiltroUsuario] = useState('');

    async function carregarUsuariosELabs() {
        try {
            const usuariosData = await listarUsuarios();
            const labsData = await getLabs();
            setUsuarios(usuariosData);
            setLaboratorios(labsData);
        } catch (err) {
            setErro('Erro ao carregar dados.');
        }
    }

    async function carregarLogsAuditoria() {
        try {
            const response = await fetch(`${API_URL}/admin/auditoria`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar logs de auditoria');
            const data = await response.json();
            const logsCompletos = data.map(log => {
                const usuario = usuarios.find(u => u.email === log.userEmail);
                return {
                    ...log,
                    // Se o usuário não for encontrado (userId: null ou userEmail não corresponde),
                    // defina userRole e userModeratorType como null
                    userRole: usuario ? usuario.role : null,
                    userModeratorType: usuario ? usuario.moderatorType : null
                };
            });
            setLogsAuditoria(logsCompletos);
        } catch (err) {
            setErro(err.message);
        }
    }

    useEffect(() => {
        carregarUsuariosELabs();
    }, []);

    useEffect(() => {
        if (abaAtiva === 'auditoria' && usuarios.length > 0) {
            carregarLogsAuditoria();
        }
    }, [abaAtiva, usuarios]);

    useEffect(() => {
        if (mensagem || erro) {
            const timer = setTimeout(() => {
                setMensagem('');
                setErro('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mensagem, erro]);

    const handleCadastroUsuario = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...novoUsuario };
            if (payload.role === 'MODERATOR-COORDINATOR') {
                payload.role = 'MODERATOR';
                payload.moderatorType = 'COORDINATOR';
            } else {
                delete payload.moderatorType;
            }

            await cadastrarUsuario(payload);
            setMensagem('Cadastro iniciado com sucesso! Um e-mail foi enviado para que o usuário defina a senha e ative a conta.');
            setNovoUsuario({ name: '', email: '', role: 'MODERATOR-COORDINATOR' });
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExcluirUsuario = async (id) => {
        if (!window.confirm('Deseja realmente excluir este usuário?')) return;
        try {
            const resposta = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!resposta.ok) throw new Error('Erro ao excluir usuário.');
            setMensagem('Usuário excluído com sucesso!');
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleCriarLab = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', novoLab.name);
            formData.append('description', novoLab.description);
            if (novoLab.image) formData.append('image', novoLab.image);

            const response = await fetch(`${API_URL}/labs`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                    // ❌ NÃO adicione 'Content-Type' manualmente ao usar FormData!
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar laboratório.');
            }

            setMensagem('Laboratório criado com sucesso!');
            setNovoLab({ name: '', description: '', image: null });
            await carregarUsuariosELabs();
        } catch (err) {
            console.error('Erro ao criar laboratório:', err);
            setErro(err.message || 'Erro ao criar laboratório.');
        }
    };

    const handleVincularUsuario = async (labId) => {
        const userId = vinculos[labId];
        if (!userId) return;
        try {
            await atribuirUsuarioAoLab(labId, userId);
            setMensagem('Coordenador vinculado com sucesso!');
            setVinculos((prev) => ({ ...prev, [labId]: '' }));
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleRemoverVinculo = async (labId, userId) => {
        try {
            await removerUsuarioDoLab(labId, userId);
            setMensagem('Usuário removido do laboratório!');
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const abrirModalLaboratorio = (lab) => {
        setLabSelecionado(lab);
        setModalAberto(true);
    };

    const laboratoriosFiltrados = laboratorios.filter(lab =>
        lab.name.toLowerCase().includes(filtroLab.toLowerCase())
    );

    const usuariosFiltrados = usuarios.filter(usuario =>
        usuario.name.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
        usuario.email.toLowerCase().includes(filtroUsuario.toLowerCase())
    );

    const getTipoUsuario = (role, moderatorType) => {
        if (role === 'ADMIN') return 'Administrador';
        if (role === 'MODERATOR' && moderatorType === 'COORDINATOR') return 'Coordenador';
        if (role === 'MODERATOR' && moderatorType === 'MONITOR') return 'Monitor';
        if (role === 'STUDENT') return 'Solicitante';
        // Se role for null ou undefined, retorne 'Desconhecido'
        if (role === null || typeof role === 'undefined') return 'Desconhecido';
        return 'Desconhecido';
    };

    const getBadgeClass = (role, moderatorType) => {
        if (role === 'ADMIN') return 'bg-purple-100 text-purple-800';
        if (role === 'MODERATOR' && moderatorType === 'COORDINATOR') return 'bg-blue-100 text-blue-800';
        if (role === 'MODERATOR' && moderatorType === 'MONITOR') return 'bg-green-100 text-green-800';
        // Se role for null ou undefined, retorne uma badge cinza
        if (role === null || typeof role === 'undefined') return 'bg-gray-100 text-gray-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <Header />
            <div className="p-6 max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Painel do Administrador</h1>

                <div className="flex border-b mb-6">
                    {['usuarios', 'laboratorios', 'auditoria'].map((aba) => (
                        <button
                            key={aba}
                            onClick={() => setAbaAtiva(aba)}
                            className={`px-4 py-2 text-sm font-medium ${abaAtiva === aba ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                        >
                            {aba === 'usuarios' ? 'Usuários' : aba === 'laboratorios' ? 'Laboratórios' : 'Auditoria'}
                        </button>
                    ))}
                </div>

                {abaAtiva === 'usuarios' && (
                    <>
                        <form onSubmit={handleCadastroUsuario} className="grid md:grid-cols-2 gap-4 mb-6">
                            <input type="text" placeholder="Nome" value={novoUsuario.name}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, name: e.target.value })}
                                className="border px-3 py-2 rounded" required />
                            <input type="email" placeholder="Email" value={novoUsuario.email}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                                className="border px-3 py-2 rounded" required />
                            <select value={novoUsuario.role}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
                                className="border px-3 py-2 rounded">
                                <option value="MODERATOR-COORDINATOR">Coordenador</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                            <button type="submit" className={`col-span-2 py-2 rounded text-white ${loading ? 'bg-gray-600' : 'bg-black hover:bg-gray-800'}`}>
                                {loading ? 'Cadastrando...' : '+ Cadastrar Usuário'}
                            </button>
                        </form>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Filtrar usuários por nome ou email..."
                                value={filtroUsuario}
                                onChange={(e) => setFiltroUsuario(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                        </div>

                        <ul className="space-y-2">
                            {usuariosFiltrados.map((usuario) => (
                                <li key={usuario.id} className="border rounded p-3 flex justify-between items-center">
                                    <span>
                                        <strong>{usuario.name}</strong> <span className="text-sm text-gray-600">({usuario.email})</span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded flex items-center gap-2">
                                            {getTipoUsuario(usuario.role, usuario.moderatorType)}

                                            {(usuario.role === 'STUDENT'
                                                ? usuario.isActive
                                                : !!usuario.password)
                                                ? (
                                                    <span className="text-green-600 text-xs">(Ativo)</span>
                                                ) : (
                                                    <span className="text-yellow-600 text-xs">(Aguardando ativação)</span>
                                                )}
                                        </span>
                                        {usuario.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleExcluirUsuario(usuario.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Excluir usuário"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {abaAtiva === 'laboratorios' && (
                    <>
                        <form onSubmit={handleCriarLab} className="grid md:grid-cols-2 gap-4 mb-6">
                            <input type="text" placeholder="Nome" value={novoLab.name}
                                onChange={(e) => setNovoLab({ ...novoLab, name: e.target.value })}
                                className="border px-3 py-2 rounded" required />
                            <input type="text" placeholder="Descrição" value={novoLab.description}
                                onChange={(e) => setNovoLab({ ...novoLab, description: e.target.value })}
                                className="border px-3 py-2 rounded" />
                            <input type="file" accept="image/*"
                                onChange={(e) => setNovoLab({ ...novoLab, image: e.target.files[0] })}
                                className="border px-3 py-2 rounded col-span-2" />
                            <button type="submit" className="col-span-2 bg-black text-white py-2 rounded hover:bg-gray-800">
                                + Criar Laboratório
                            </button>
                        </form>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Filtrar laboratórios por nome..."
                                value={filtroLab}
                                onChange={(e) => setFiltroLab(e.target.value)}
                                className="border px-3 py-2 rounded w-full max-w-md"
                            />
                        </div>

                        <div className="space-y-3">
                            {laboratoriosFiltrados.map((lab) => {
                                const coordenadores = usuarios.filter(
                                    (u) =>
                                        u.role === 'MODERATOR' &&
                                        u.moderatorType === 'COORDINATOR' &&
                                        u.moderatorLabs?.some((ml) => ml.labId === lab.id)
                                );
                                const monitores = usuarios.filter(
                                    (u) =>
                                        u.role === 'MODERATOR' &&
                                        u.moderatorType === 'MONITOR' &&
                                        u.moderatorLabs?.some((ml) => ml.labId === lab.id)
                                );

                                return (
                                    <div key={lab.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg">{lab.name}</h3>
                                                {lab.description && (
                                                    <p className="text-sm text-gray-600 break-words whitespace-pre-wrap mt-1">
                                                        {lab.description.length > 150
                                                            ? `${lab.description.substring(0, 150)}...`
                                                            : lab.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-shrink-0 items-center gap-2">
                                                <div className="flex gap-1">
                                                    {coordenadores.length > 0 && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                            {coordenadores.length} coord.
                                                        </span>
                                                    )}
                                                    {monitores.length > 0 && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                            {monitores.length} monit.
                                                        </span>
                                                    )}
                                                </div>
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

                {abaAtiva === 'auditoria' && (
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                                            Data/Hora
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                                            Usuário
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                            Categoria
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logsAuditoria.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.timestamp).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                                <div className="text-sm text-gray-500">{log.userEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getBadgeClass(log.userRole, log.userModeratorType)}`}>
                                                    {getTipoUsuario(log.userRole, log.userModeratorType)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatarTextoDoLog(log.acao || log.action)}
                                                {log.detalhes && (
                                                    <div className="text-xs text-gray-400 mt-1 whitespace-pre-line">
                                                        {log.detalhes}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logsAuditoria.length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-white">
                                    Nenhum registro de auditoria encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Gerenciamento do Laboratório */}
            {modalAberto && labSelecionado && (
                <Modal onClose={() => setModalAberto(false)} titulo={`Gerenciar ${labSelecionado.name}`}>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Adicionar coordenador</h4>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={vinculos[labSelecionado.id] || ''}
                                    onChange={(e) => setVinculos((prev) => ({ ...prev, [labSelecionado.id]: e.target.value }))}
                                    className="border px-2 py-1 rounded w-full"
                                >
                                    <option value="">Selecione um coordenador</option>
                                    {usuarios
                                        .filter((u) => u.role === 'MODERATOR' && u.moderatorType === 'COORDINATOR')
                                        .map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                </select>
                                <button
                                    onClick={() => handleVincularUsuario(labSelecionado.id)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold mb-1">Coordenadores</h4>
                            <ul className="space-y-1 mb-2">
                                {usuarios
                                    .filter((u) =>
                                        u.role === 'MODERATOR' &&
                                        u.moderatorType === 'COORDINATOR' &&
                                        u.moderatorLabs?.some((ml) => ml.labId === labSelecionado.id)
                                    )
                                    .map((u) => (
                                        <li key={u.id} className="flex justify-between items-center text-sm border px-3 py-2 rounded">
                                            <span>{u.name}</span>
                                            <button
                                                onClick={() => handleRemoverVinculo(labSelecionado.id, u.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Remover"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                {usuarios.filter((u) =>
                                    u.role === 'MODERATOR' &&
                                    u.moderatorType === 'COORDINATOR' &&
                                    u.moderatorLabs?.some((ml) => ml.labId === labSelecionado.id)
                                ).length === 0 && <p className="text-sm text-gray-400">Nenhum coordenador vinculado.</p>}
                            </ul>

                            <h4 className="text-sm font-semibold mb-1">Monitores</h4>
                            <ul className="space-y-1">
                                {usuarios
                                    .filter((u) =>
                                        u.role === 'MODERATOR' &&
                                        u.moderatorType === 'MONITOR' &&
                                        u.moderatorLabs?.some((ml) => ml.labId === labSelecionado.id)
                                    )
                                    .map((u) => (
                                        <li key={u.id} className="flex justify-between items-center text-sm border px-3 py-2 rounded">
                                            <span>{u.name}</span>
                                        </li>
                                    ))}
                                {usuarios.filter((u) =>
                                    u.role === 'MODERATOR' &&
                                    u.moderatorType === 'MONITOR' &&
                                    u.moderatorLabs?.some((ml) => ml.labId === labSelecionado.id)
                                ).length === 0 && <p className="text-sm text-gray-400">Nenhum monitor vinculado.</p>}
                            </ul>
                        </div>

                        <button
                            onClick={async () => {
                                if (window.confirm(`Tem certeza que deseja excluir o laboratório ${labSelecionado.name}?`)) {
                                    try {
                                        await deletarLaboratorio(labSelecionado.id);
                                        setMensagem('Laboratório excluído com sucesso!');
                                        setModalAberto(false);
                                        await carregarUsuariosELabs();
                                    } catch (err) {
                                        setErro('Erro ao excluir laboratório.');
                                    }
                                }
                            }}
                            className="mt-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full"
                        >
                            Excluir Laboratório
                        </button>
                    </div>
                </Modal>
            )}

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

export default PainelAdmin;