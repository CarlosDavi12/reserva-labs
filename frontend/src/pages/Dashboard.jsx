import { useEffect, useState } from 'react';
import { getLabs, createReservation } from '../services/api';
import Header from '../components/Header';

function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const [labs, setLabs] = useState([]);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [datas, setDatas] = useState({});

    useEffect(() => {
        async function fetchLabs() {
            try {
                const data = await getLabs(token);
                setLabs(data);
            } catch (err) {
                setErro('Não foi possível carregar os laboratórios.');
            }
        }

        fetchLabs();
    }, [token]);

    const handleReservation = async (labId) => {
        const date = datas[labId];

        if (!date) {
            setMensagem('Você precisa selecionar uma data antes de reservar.');
            return;
        }

        try {
            await createReservation(token, labId, date);
            setMensagem('Reserva solicitada com sucesso!');
        } catch (err) {
            setMensagem(err.message || 'Erro ao solicitar reserva.');
        }
    };

    return (
        <>
            <Header />
            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Olá, {user?.name}</h1>
                <p className="text-gray-600 mb-6">Selecione um laboratório para fazer sua reserva</p>

                {erro && <p className="text-red-600 mb-4">{erro}</p>}
                {mensagem && <p className="text-green-600 mb-4">{mensagem}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labs.map((lab) => (
                        <div
                            key={lab.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                        >
                            {lab.imageUrl ? (
                                <img
                                    src={`http://localhost:3333${lab.imageUrl}`}
                                    alt={`Imagem de ${lab.name}`}
                                    className="w-full h-40 object-cover rounded mb-4"
                                />
                            ) : (
                                <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded mb-4">
                                    <span className="text-gray-400">Sem imagem</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{lab.name}</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    {lab.description || 'Sem descrição disponível.'}
                                </p>

                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                                    value={datas[lab.id] || ''}
                                    onChange={(e) =>
                                        setDatas((prev) => ({
                                            ...prev,
                                            [lab.id]: e.target.value,
                                        }))
                                    }
                                />

                                <button
                                    onClick={() => handleReservation(lab.id)}
                                    className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
                                >
                                    Reservar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Dashboard;
