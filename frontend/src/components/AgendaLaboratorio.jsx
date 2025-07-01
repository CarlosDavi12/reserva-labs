import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import '../agenda.css';

function renderEvento(info) {
    const status = info.event.title.split('(')[1]?.replace(')', '').toLowerCase();

    const bgColor =
        status === 'aprovada' || status === '✅' ? 'bg-green-500' :
            status === 'pendente' || status === '🕒' ? 'bg-yellow-400' :
                'bg-red-500';

    return {
        domNodes: [
            (() => {
                const el = document.createElement('div');
                el.className = `text-white text-xs px-2 py-1 rounded ${bgColor} shadow-sm font-medium`;
                el.innerText = info.event.title.split('(')[0].trim();
                return el;
            })()
        ]
    };
}

function AgendaLaboratorio({ reservas }) {
    const eventos = reservas.map((reserva) => ({
        title: `${reserva.user?.name || 'Reserva'} (${reserva.status === 'APPROVED' ? 'Aprovada' : reserva.status === 'PENDING' ? 'Pendente' : 'Rejeitada'})`,
        start: reserva.start,
        end: reserva.end,
        allDay: false
    }));

    return (
        <div className="mt-4 border rounded-xl p-4 bg-white shadow-sm">
            <h3 className="text-md font-semibold mb-3 text-gray-800">Agenda do Laboratório</h3>

            <FullCalendar
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={ptBrLocale}
                events={eventos}
                height={500}
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                headerToolbar={{
                    start: 'title',
                    end: 'today,timeGridWeek,dayGridMonth prev,next'
                }}
                eventContent={renderEvento}
            />

            <div className="text-xs mt-3 space-x-4">
                <span className="inline-flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span> Aprovada
                </span>
                <span className="inline-flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span> Pendente
                </span>
                <span className="inline-flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span> Rejeitada
                </span>
            </div>
        </div>
    );
}

export default AgendaLaboratorio;
