import { useEffect, useState } from 'react';
import { getLabs, createReservation, API_URL } from '../services/api';
import Header from '../components/Header';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

function AgendaLaboratorio({ reservas }) {
    const eventos = reservas
        .filter((reserva) => reserva.status === 'APPROVED')
        .map((reserva) => ({
            title: reserva.user?.name || 'Reserva',
            start: reserva.start,
            end: reserva.end,
        }));

    return (
        <div className="mt-4 border rounded p-4 bg-white shadow-sm">
            <FullCalendar
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={ptBrLocale}
                events={eventos}
                height={350}
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                headerToolbar={{
                    start: 'title',
                    center: '',
                    end: 'today,timeGridWeek,dayGridMonth prev,next',
                }}
                buttonText={{
                    today: 'Hoje',
                    timeGridWeek: 'Semana',
                    dayGridMonth: 'Mês',
                }}
            />
        </div>
    );
}

function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const [labs, setLabs] = useState([]);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [datas, setDatas] = useState({});
    const [agendaVisivel, setAgendaVisivel] = useState({});
    const [descricaoExpandida, setDescricaoExpandida] = useState({});

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

    useEffect(() => {
        if (mensagem || erro) {
            const timer = setTimeout(() => {
                setMensagem('');
                setErro('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mensagem, erro]);

    const getTodayDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString().split('T')[0];
    };

    const handleReservation = async (labId) => {
        const { date, startTime, endTime } = datas[labId] || {};

        if (!date || !startTime || !endTime) {
            setMensagem('Você precisa preencher a data, o horário de início e de término.');
            return;
        }

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setMensagem('Datas inválidas.');
            return;
        }

        const agora = new Date();
        if (start < agora) {
            setMensagem('Não é possível fazer reservas para horários passados.');
            return;
        }

        if (end <= start) {
            setMensagem('A hora de término deve ser após a de início.');
            return;
        }

        try {
            await createReservation(token, labId, start.toISOString(), end.toISOString());
            setMensagem('Reserva solicitada com sucesso!');

            setDatas((prev) => ({
                ...prev,
                [labId]: { date: '', startTime: '', endTime: '' }
            }));
        } catch (err) {
            setMensagem(err.message || 'Erro ao solicitar reserva.');
        }
    };

    const toggleAgenda = (labId) => {
        setAgendaVisivel((prev) => ({
            ...prev,
            [labId]: !prev[labId],
        }));
    };

    return (
        <>
            <Header />
            <div className="max-w-6xl mx-auto px-4 py-10">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">Olá, {user?.name}</h1>
                <p className="text-gray-600 mb-6">Selecione um laboratório para fazer sua reserva</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    {labs.map((lab) => (
                        <div
                            key={lab.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition flex flex-col self-start min-h-[540px]"
                        >
                            {lab.imageUrl ? (
                                <div className="w-full aspect-[16/9] bg-gray-100 rounded mb-4 overflow-hidden">
                                    <img
                                        src={`${API_URL}${lab.imageUrl}`}
                                        alt={`Imagem de ${lab.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center rounded mb-4">
                                    <span className="text-gray-400">Sem imagem</span>
                                </div>
                            )}

                            <h3
                                className="text-lg font-semibold text-gray-900 mb-1 break-words truncate max-w-full"
                                title={lab.name}
                            >
                                {lab.name}
                            </h3>

                            <div className="mb-3">
                                <p
                                    className={`
                                        text-sm text-gray-600 break-words max-w-full transition-all duration-300
                                        ${descricaoExpandida[lab.id] ? '' : 'line-clamp-1'}
                                    `}
                                >
                                    {lab.description || 'Sem descrição disponível.'}
                                </p>
                                {lab.description && lab.description.length > 50 && (
                                    <button
                                        onClick={() =>
                                            setDescricaoExpandida((prev) => ({
                                                ...prev,
                                                [lab.id]: !prev[lab.id],
                                            }))
                                        }
                                        className="mt-1 text-xs text-gray-500 hover:text-black transition underline"
                                    >
                                        {descricaoExpandida[lab.id] ? 'Ver menos' : 'Ver mais'}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    min={getTodayDate()}
                                    value={datas[lab.id]?.date || ''}
                                    onChange={(e) =>
                                        setDatas((prev) => ({
                                            ...prev,
                                            [lab.id]: {
                                                ...(prev[lab.id] || {}),
                                                date: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                <input
                                    type="time"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={datas[lab.id]?.startTime || ''}
                                    onChange={(e) =>
                                        setDatas((prev) => ({
                                            ...prev,
                                            [lab.id]: {
                                                ...(prev[lab.id] || {}),
                                                startTime: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                <input
                                    type="time"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={datas[lab.id]?.endTime || ''}
                                    onChange={(e) =>
                                        setDatas((prev) => ({
                                            ...prev,
                                            [lab.id]: {
                                                ...(prev[lab.id] || {}),
                                                endTime: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>

                            <button
                                onClick={() => handleReservation(lab.id)}
                                className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition mb-3"
                            >
                                Reservar
                            </button>

                            <button
                                onClick={() => toggleAgenda(lab.id)}
                                className="inline-flex items-center text-sm text-gray-700 hover:text-black transition font-medium mt-1"
                            >
                                <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d={agendaVisivel[lab.id]
                                            ? 'M6 18L18 6M6 6l12 12'
                                            : 'M8 7V3m8 4V3m-9 4h10M5 11h14M5 15h14M5 19h14'}
                                    />
                                </svg>
                                {agendaVisivel[lab.id] ? 'Ocultar agenda' : 'Ver agenda do laboratório'}
                            </button>

                            {agendaVisivel[lab.id] && (
                                <div className="mt-4">
                                    <AgendaLaboratorio reservas={lab.reservations || []} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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

export default Dashboard;
