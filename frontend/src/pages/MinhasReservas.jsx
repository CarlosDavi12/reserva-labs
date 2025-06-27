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

    return (
        <>
            <Header />
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Minhas Reservas</h1>
                <p className="text-gray-600 mb-6">Acompanhe o status das suas reservas</p>

                {erro && <p className="text-red-600 mb-4">{erro}</p>}

                {reservas.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500 shadow-sm">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-200" />
                        <p>Você ainda não possui reservas</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {reservas.map((reserva) => (
                            <li
                                key={reserva.id}
                                className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm"
                            >
                                <p className="text-sm text-gray-500 mb-1">
                                    <strong className="text-gray-800">Laboratório:</strong>{' '}
                                    {reserva.lab?.name || 'Desconhecido'}
                                </p>
                                <p className="text-sm text-gray-500 mb-1">
                                    <strong className="text-gray-800">Data:</strong>{' '}
                                    {new Date(reserva.date).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <strong className="text-gray-800">Status:</strong>{' '}
                                    {reserva.status}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

export default MinhasReservas;
