import { createLog } from '../services/logService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createReservation(req, res) {
    const { labId, date } = req.body;

    try {
        const reservation = await prisma.reservation.create({
            data: {
                userId: req.user.id,
                labId,
                date: new Date(date),
            },
        });

        await createLog(req.user.id, `Solicitou reserva para o laboratório ${labId} na data ${date}`);

        res.status(201).json(reservation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function listReservations(req, res) {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                user: true,
                lab: true,
            },
        });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateReservationStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
    }

    try {
        const updated = await prisma.reservation.update({
            where: { id },
            data: { status },
        });

        await createLog(req.user.id, `Atualizou reserva ${id} para status ${status}`);

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function getReservationsByModerator(req, res) {
    try {
        const userId = req.user.id;

        // Buscar todos os laboratórios que o moderador está associado
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
                lab: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.json(reservas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reservas para moderador.' });
    }
}
