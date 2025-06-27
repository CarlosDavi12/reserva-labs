import { useEffect, useState } from 'react';
import { getAllReservations, updateReservationStatus } from '../services/api';
import Header from '../components/Header';

function PainelModerador() {
    const token = localStorage.getItem('token');
    const [reservas, setReservas] = useState([]);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');

    const traduzirStatus = (status) => {
        switch (status) {
            case 'PENDING': return 'pendente';
            case 'APPROVED': return 'aprovada';
            case 'REJECTED': return 'rejeitada';
            default: return status.toLowerCase();
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getAllReservations(token);
                setReservas(data);
            } catch (err) {
                setErro('Erro ao carregar reservas.');
            }
        }

        fetchData();
    }, [token]);

    const atualizarStatus = async (id, status) => {
        try {
            await updateReservationStatus(token, id, status);
            setReservas((prev) =>
                prev.map((res) =>
                    res.id === id ? { ...res, status } : res
                )
            );
            setMensagem(`Reserva ${traduzirStatus(status)} com sucesso.`);
            setTimeout(() => setMensagem(''), 3000);
        } catch (err) {
            setMensagem('Erro ao atualizar reserva.');
            setTimeout(() => setMensagem(''), 3000);
        }
    };

    return (
        <>
            <Header />
            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Painel do Moderador</h1>
                <p className="text-gray-600 mb-6">
                    Gerencie as reservas dos laboratórios sob sua responsabilidade
                </p>

                {erro && <p className="text-red-600 mb-4">{erro}</p>}
                {mensagem && <p className="text-green-600 mb-4">{mensagem}</p>}

                {['PENDING', 'APPROVED', 'REJECTED'].map((statusKey) => {
                    const titulo = {
                        PENDING: 'Reservas Pendentes',
                        APPROVED: 'Reservas Aprovadas',
                        REJECTED: 'Reservas Rejeitadas'
                    }[statusKey];

                    const reservasFiltradas = reservas.filter(r => r.status === statusKey);

                    return (
                        <div key={statusKey} className="mb-10">
                            <h2 className="text-xl font-semibold mb-3 text-gray-800">{titulo}</h2>

                            {reservasFiltradas.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 shadow-sm">
                                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-200" />
                                    <p>
                                        {statusKey === 'PENDING' && 'Não há reservas pendentes para aprovação'}
                                        {statusKey === 'APPROVED' && 'Nenhuma reserva aprovada'}
                                        {statusKey === 'REJECTED' && 'Nenhuma reserva rejeitada'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {reservasFiltradas.map((res) => (
                                        <li key={res.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                                            <p className="text-sm text-gray-700 mb-1"><strong>Usuário:</strong> {res.user?.name}</p>
                                            <p className="text-sm text-gray-700 mb-1"><strong>Laboratório:</strong> {res.lab?.name}</p>
                                            <p className="text-sm text-gray-700 mb-1"><strong>Data:</strong> {new Date(res.date).toLocaleString()}</p>
                                            <p className="text-sm text-gray-700"><strong>Status:</strong> {traduzirStatus(res.status)}</p>

                                            {statusKey === 'PENDING' && (
                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => atualizarStatus(res.id, 'APPROVED')}
                                                        className="px-4 py-2 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => atualizarStatus(res.id, 'REJECTED')}
                                                        className="px-4 py-2 rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                                                    >
                                                        Rejeitar
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default PainelModerador;
