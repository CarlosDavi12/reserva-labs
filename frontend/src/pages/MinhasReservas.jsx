import { useEffect, useState } from 'react';
import { getMyReservations } from '../services/api';
import Header from '../components/Header';

function MinhasReservas() {
    const token = localStorage.getItem('token');
    const [reservas, setReservas] = useState([]);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getMyReservations(token);
                setReservas(data);
            } catch (err) {
                setErro('Erro ao carregar suas reservas.');
            }
        }

        fetchData();
    }, [token]);

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

    return (
        <>
            <Header />
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Minhas Reservas</h1>
                <p className="text-gray-600 mb-6">Acompanhe o status das suas reservas</p>

                {erro && <p className="text-red-600 mb-4">{erro}</p>}

                {reservas.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500 shadow-sm">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                            📅
                        </div>
                        <p>Você ainda não possui reservas</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {reservas.map((reserva) => (
                            <li
                                key={reserva.id}
                                className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            <strong>Laboratório:</strong> {reserva.lab?.name || 'Desconhecido'}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Data:</strong> {formatarDataHora(reserva.start, reserva.end)}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Solicitada em:</strong> {formatarDataCriacao(reserva.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`
                                        text-xs font-medium px-3 py-1 rounded-full 
                                        ${reserva.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-700'
                                            : reserva.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'}
                                    `}>
                                        {reserva.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

export default MinhasReservas;
