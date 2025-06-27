import { useEffect, useState, useRef } from 'react';
import {
    getLabs,
    associarModerador,
    deletarLaboratorio,
    listarAssociacoes,
    removerAssociacao,
} from '../services/api';
import Header from '../components/Header';

function PainelAdmin() {
    const token = localStorage.getItem('token');
    const [abaAtiva, setAbaAtiva] = useState('usuarios');
    const [moderadores, setModeradores] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [laboratorios, setLaboratorios] = useState([]);
    const [associacoes, setAssociacoes] = useState([]);
    const [userId, setUserId] = useState('');
    const [labId, setLabId] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [novoLab, setNovoLab] = useState({ name: '', description: '', image: null });
    const [novoUsuario, setNovoUsuario] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
    });

    const mensagemRef = useRef(null);

    async function carregarUsuariosELabs() {
        try {
            const respostaUsuarios = await fetch('http://localhost:3333/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const usuariosData = await respostaUsuarios.json();
            setUsuarios(usuariosData);
            setModeradores(usuariosData.filter((u) => u.role === 'MODERATOR'));

            const labs = await getLabs(token);
            setLaboratorios(labs);

            const assoc = await listarAssociacoes(token);
            setAssociacoes(assoc);
        } catch (err) {
            setErro('Erro ao carregar dados.');
        }
    }

    useEffect(() => {
        carregarUsuariosELabs();
    }, [token]);

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
        try {
            const resposta = await fetch('http://localhost:3333/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(novoUsuario),
            });

            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.error || 'Erro ao cadastrar usuário.');

            setMensagem('Usuário cadastrado com sucesso!');
            setNovoUsuario({ name: '', email: '', password: '', role: 'STUDENT' });
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleExcluirUsuario = async (id) => {
        if (!window.confirm('Deseja realmente excluir este usuário?')) return;
        try {
            const resposta = await fetch(`http://localhost:3333/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
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

            const resposta = await fetch('http://localhost:3333/labs', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!resposta.ok) throw new Error('Erro ao criar laboratório');
            setMensagem('Laboratório criado com sucesso!');
            setNovoLab({ name: '', description: '', image: null });
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleDeletarLab = async (id) => {
        if (!window.confirm('Deseja excluir este laboratório?')) return;
        try {
            await deletarLaboratorio(token, id);
            setMensagem('Laboratório excluído com sucesso!');
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleAssociar = async (e) => {
        e.preventDefault();
        try {
            await associarModerador(token, userId, labId);
            setMensagem('Moderador associado com sucesso!');
            setUserId('');
            setLabId('');
            await carregarUsuariosELabs();
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleRemoverAssociacao = async (id) => {
        if (!window.confirm('Deseja remover esta associação?')) return;
        try {
            await removerAssociacao(token, id);
            setMensagem('Associação removida com sucesso!');
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
                <p className="text-gray-600 mb-6">Gerencie usuários, laboratórios e associações</p>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    {['usuarios', 'laboratorios', 'associacoes'].map((aba) => (
                        <button
                            key={aba}
                            onClick={() => setAbaAtiva(aba)}
                            className={`px-4 py-2 text-sm font-medium ${abaAtiva === aba ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            {aba === 'usuarios' ? 'Usuários' : aba === 'laboratorios' ? 'Laboratórios' : 'Associações'}
                        </button>
                    ))}
                </div>

                {erro && <p className="text-red-600 mb-4">{erro}</p>}
                {mensagem && <p className="text-green-600 mb-4">{mensagem}</p>}

                {abaAtiva === 'usuarios' && (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Cadastrar Usuário</h2>
                        <form onSubmit={handleCadastroUsuario} className="grid md:grid-cols-2 gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="Nome"
                                value={novoUsuario.name}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, name: e.target.value })}
                                className="border px-3 py-2 rounded"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={novoUsuario.email}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                                className="border px-3 py-2 rounded"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Senha"
                                value={novoUsuario.password}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, password: e.target.value })}
                                className="border px-3 py-2 rounded"
                                required
                            />
                            <select
                                value={novoUsuario.role}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
                                className="border px-3 py-2 rounded"
                            >
                                <option value="STUDENT">STUDENT</option>
                                <option value="MODERATOR">MODERATOR</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                                type="submit"
                                className="col-span-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 flex items-center justify-center"
                            >
                                + Cadastrar Usuário
                            </button>
                        </form>

                        <h2 className="text-lg font-semibold mb-2">Lista de Usuários</h2>
                        <ul className="space-y-2">
                            {usuarios.map((usuario) => (
                                <li key={usuario.id} className="border rounded p-3 flex justify-between items-center">
                                    <span>
                                        <strong>{usuario.name}</strong> <span className="text-sm text-gray-600">({usuario.email})</span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{usuario.role}</span>
                                        {usuario.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleExcluirUsuario(usuario.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center justify-center"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M6 7H18V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V7ZM8.5 9V17H10V9H8.5ZM14 9V17H15.5V9H14ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z" />
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
                        <h2 className="text-lg font-semibold mb-2">Criar Laboratório</h2>
                        <form onSubmit={handleCriarLab} className="grid md:grid-cols-2 gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="Nome do laboratório"
                                value={novoLab.name}
                                onChange={(e) => setNovoLab({ ...novoLab, name: e.target.value })}
                                className="border px-3 py-2 rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Descrição (opcional)"
                                value={novoLab.description}
                                onChange={(e) => setNovoLab({ ...novoLab, description: e.target.value })}
                                className="border px-3 py-2 rounded"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNovoLab({ ...novoLab, image: e.target.files[0] })}
                                className="border px-3 py-2 rounded col-span-2"
                            />
                            <button
                                type="submit"
                                className="col-span-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 flex justify-center"
                            >
                                + Criar Laboratório
                            </button>
                        </form>

                        <h2 className="text-lg font-semibold mb-2">Lista de Laboratórios</h2>
                        <ul className="grid md:grid-cols-2 gap-4">
                            {laboratorios.map((lab) => (
                                <li key={lab.id} className="border rounded p-4 bg-white shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold">{lab.name}</h3>
                                        {lab.description && <p className="text-sm text-gray-600">{lab.description}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDeletarLab(lab.id)}
                                        className="mt-3 self-start bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Excluir
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {abaAtiva === 'associacoes' && (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Associar Moderador a Laboratório</h2>
                        <form onSubmit={handleAssociar} className="grid md:grid-cols-2 gap-4 mb-6">
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="border px-3 py-2 rounded"
                                required
                            >
                                <option value="">Selecione um moderador</option>
                                {moderadores.map((mod) => (
                                    <option key={mod.id} value={mod.id}>
                                        {mod.name} - {mod.email}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={labId}
                                onChange={(e) => setLabId(e.target.value)}
                                className="border px-3 py-2 rounded"
                                required
                            >
                                <option value="">Selecione um laboratório</option>
                                {laboratorios.map((lab) => (
                                    <option key={lab.id} value={lab.id}>
                                        {lab.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="col-span-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 flex justify-center"
                            >
                                Associar
                            </button>
                        </form>

                        <h2 className="text-lg font-semibold mb-2">Lista de Associações</h2>
                        <ul className="space-y-2">
                            {associacoes.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex justify-between items-center border rounded p-3 bg-white shadow-sm"
                                >
                                    <span>
                                        <strong>{a.user.name}</strong> — {a.lab.name}
                                    </span>
                                    <button
                                        onClick={() => handleRemoverAssociacao(a.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    );
}

export default PainelAdmin;
