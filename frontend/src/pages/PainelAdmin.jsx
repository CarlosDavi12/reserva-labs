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

function PainelAdmin() {
    const [abaAtiva, setAbaAtiva] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [novoLab, setNovoLab] = useState({ name: '', description: '', image: null });
    const [novoUsuario, setNovoUsuario] = useState({ name: '', email: '', role: 'MODERATOR-COORDINATOR' });
    const [vinculos, setVinculos] = useState({});
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        carregarUsuariosELabs();
    }, []);

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
                payload.moderatorType = 'COORDENADOR';
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
            const resposta = await fetch(`http://localhost:3333/admin/users/${id}`, {
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

            await fetch('http://localhost:3333/labs', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });

            setMensagem('Laboratório criado com sucesso!');
            setNovoLab({ name: '', description: '', image: null });
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
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

    return (
        <>
            <Header />
            <div className="p-6 max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Painel do Administrador</h1>

                <div className="flex border-b mb-6">
                    {['usuarios', 'laboratorios'].map((aba) => (
                        <button
                            key={aba}
                            onClick={() => setAbaAtiva(aba)}
                            className={`px-4 py-2 text-sm font-medium ${abaAtiva === aba ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                        >
                            {aba === 'usuarios' ? 'Usuários' : 'Laboratórios'}
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

                        <ul className="space-y-2">
                            {usuarios.map((usuario) => (
                                <li key={usuario.id} className="border rounded p-3 flex justify-between items-center">
                                    <span>
                                        <strong>{usuario.name}</strong> <span className="text-sm text-gray-600">({usuario.email})</span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded flex items-center gap-2">
                                            {usuario.role === 'STUDENT'
                                                ? 'Solicitante'
                                                : usuario.role === 'MODERATOR'
                                                    ? usuario.moderatorType === 'COORDINATOR'
                                                        ? 'Coordenador'
                                                        : 'Monitor'
                                                    : 'Administrador'}

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
                                            <button onClick={() => handleExcluirUsuario(usuario.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                title="Excluir usuário">🗑️</button>
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

                        <ul className="space-y-4">
                            {laboratorios.map((lab) => {
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
                                    <li key={lab.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="font-bold text-lg">{lab.name}</h3>
                                        {lab.description && <p className="text-sm text-gray-600">{lab.description}</p>}

                                        <div className="mt-4">
                                            <h4 className="text-sm font-semibold mb-2">Adicionar coordenador</h4>
                                            <div className="flex gap-2 items-center">
                                                <select
                                                    value={vinculos[lab.id] || ''}
                                                    onChange={(e) => setVinculos((prev) => ({ ...prev, [lab.id]: e.target.value }))}
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
                                                    onClick={() => handleVincularUsuario(lab.id)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                >
                                                    Adicionar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h4 className="text-sm font-semibold mb-1">Coordenadores</h4>
                                            <ul className="space-y-1 mb-2">
                                                {coordenadores.map((u) => (
                                                    <li key={u.id} className="flex justify-between items-center text-sm border px-3 py-2 rounded">
                                                        <span>{u.name}</span>
                                                        <button
                                                            onClick={() => handleRemoverVinculo(lab.id, u.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Remover"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </li>
                                                ))}
                                                {coordenadores.length === 0 && <p className="text-sm text-gray-400">Nenhum coordenador vinculado.</p>}
                                            </ul>

                                            <h4 className="text-sm font-semibold mb-1">Monitores</h4>
                                            <ul className="space-y-1">
                                                {monitores.map((u) => (
                                                    <li key={u.id} className="flex justify-between items-center text-sm border px-3 py-2 rounded">
                                                        <span>{u.name}</span>
                                                        <button
                                                            onClick={() => handleRemoverVinculo(lab.id, u.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Remover"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </li>
                                                ))}
                                                {monitores.length === 0 && <p className="text-sm text-gray-400">Nenhum monitor vinculado.</p>}
                                            </ul>
                                        </div>

                                        <button
                                            onClick={() => deletarLaboratorio(lab.id).then(() => carregarUsuariosELabs())}
                                            className="mt-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        >
                                            Excluir Laboratório
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </div>

            {/* ✅ Toast flutuante */}
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
