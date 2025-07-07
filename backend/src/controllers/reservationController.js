import { createLog } from '../services/logService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔧 Criação de reserva com checagem de conflito de horário
export async function createReservation(req, res) {
    const { labId, start, end } = req.body;

    let dataInicio, dataFim;
    try {
        dataInicio = new Date(start);
        dataFim = new Date(end);

        if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
            throw new Error();
        }

        if (dataFim <= dataInicio) {
            return res.status(400).json({ error: 'Horário final deve ser após o horário inicial.' });
        }

    } catch {
        return res.status(400).json({ error: 'Formato de data/hora inválido.' });
    }

    const agora = new Date();
    if (dataInicio < agora) {
        return res.status(400).json({ error: 'Não é possível reservar para um horário passado.' });
    }

    try {
        // Checa conflito
        const conflito = await prisma.reservation.findFirst({
            where: {
                labId,
                status: { in: ['PENDING', 'APPROVED'] },
                AND: [
                    { start: { lt: dataFim } },
                    { end: { gt: dataInicio } }
                ]
            }
        });

        if (conflito) {
            return res.status(400).json({
                error: 'Já existe uma reserva nesse laboratório que conflita com o horário solicitado.'
            });
        }

        const reservation = await prisma.reservation.create({
            data: {
                userId: req.user.id,
                labId,
                start: dataInicio,
                end: dataFim,
                status: 'PENDING'
            },
        });

        // Buscar nome do laboratório para o log
        const lab = await prisma.lab.findUnique({ where: { id: labId } });

        await createLog(
            req.user.id,
            `Solicitou reserva para o laboratório "${lab?.name || labId}" de ${dataInicio.toISOString()} até ${dataFim.toISOString()}`
        );

        res.status(201).json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// 🔧 Lista todas as reservas com seus usuários e laboratórios (para admin e coordenação)
export async function listReservations(req, res) {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                user: true,
                lab: true,
            },
            orderBy: {
                start: 'desc',
            }
        });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 🔧 Atualiza status da reserva para APPROVED ou REJECTED
export async function updateReservationStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
    }

    try {
        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                status,
                updatedBy: { connect: { id: req.user.id } }
            },
        });

        await createLog(req.user.id, `Atualizou reserva ${id} para status ${status}`);

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// 🔧 Lista reservas visíveis para o moderador logado (coordenador ou monitor)
export async function getReservationsByModerator(req, res) {
    try {
        const userId = req.user.id;

        const associations = await prisma.moderatorLab.findMany({
            where: { userId },
            select: { labId: true }
        });

        const labIds = associations.map(a => a.labId);

        const reservas = await prisma.reservation.findMany({
            where: {
                labId: { in: labIds }
            },
            include: {
                user: true,
                lab: true,
                updatedBy: true // ✅ adicionado para exibir quem aprovou/rejeitou
            },
            orderBy: {
                start: 'desc'
            }
        });

        res.json(reservas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reservas para moderador.' });
    }
}

// 🔧 Lista apenas as reservas do usuário logado
export async function getMyReservations(req, res) {
    try {
        const reservations = await prisma.reservation.findMany({
            where: { userId: req.user.id },
            include: {
                lab: true,
            },
            orderBy: {
                start: 'desc'
            }
        });
        res.json(reservations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar suas reservas.' });
    }
}
