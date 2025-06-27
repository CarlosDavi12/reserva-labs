import express from 'express';
import {
    createReservation,
    listReservations,
    updateReservationStatus,
} from '../controllers/reservationController.js';

import {
    authenticateToken,
    authorizeRoles,
} from '../middlewares/authMiddleware.js';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = express.Router();

// Criar reserva (aluno)
router.post('/', authenticateToken, createReservation);

// Listar reservas do usuário autenticado (solicitante)
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const reservations = await prisma.reservation.findMany({
            where: { userId },
            include: {
                lab: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar reservas do usuário' });
    }
});

// Listar reservas de laboratórios associados ao moderador
router.get('/moderator', authenticateToken, authorizeRoles('MODERATOR'), async (req, res) => {
    const userId = req.user.id;

    try {
        const moderatorLabs = await prisma.moderatorLab.findMany({
            where: { userId },
            select: { labId: true },
        });

        const labIds = moderatorLabs.map((ml) => ml.labId);

        const reservations = await prisma.reservation.findMany({
            where: { labId: { in: labIds } },
            include: {
                user: true,
                lab: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        res.json(reservations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reservas do moderador.' });
    }
});

// Listar reservas (ajustado para role do usuário)
router.get('/', authenticateToken, async (req, res) => {
    const role = req.user.role;

    if (role === 'ADMIN') {
        // Admin vê todas as reservas
        return listReservations(req, res);
    }

    if (role === 'MODERATOR') {
        // Moderador vê apenas os laboratórios que ele modera
        const userId = req.user.id;

        try {
            const moderatorLabs = await prisma.moderatorLab.findMany({
                where: { userId },
                select: { labId: true },
            });

            const labIds = moderatorLabs.map((ml) => ml.labId);

            const reservations = await prisma.reservation.findMany({
                where: { labId: { in: labIds } },
                include: {
                    user: true,
                    lab: true,
                },
                orderBy: {
                    date: 'desc',
                },
            });

            return res.json(reservations);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao buscar reservas do moderador.' });
        }
    }

    // Solicitante: vê apenas suas reservas
    try {
        const userId = req.user.id;

        const reservations = await prisma.reservation.findMany({
            where: { userId },
            include: {
                lab: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        return res.json(reservations);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar reservas do usuário.' });
    }
});

// Atualizar status da reserva (admin/moderador)
router.patch('/:id', authenticateToken, authorizeRoles('MODERATOR', 'ADMIN'), updateReservationStatus);

export default router;
