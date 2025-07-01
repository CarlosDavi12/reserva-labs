import express from 'express';
import {
    associateModeratorToLab,
    listAssociations,
    removeAssociation
} from '../controllers/moderatorLabController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import prisma from '../config/prismaClient.js'; // ✅ Import necessário para acessar o banco

const router = express.Router();

// Requer ADMIN para todas as ações abaixo

// Criar associação entre moderador e laboratório
router.post('/', authenticateToken, authorizeRoles('ADMIN'), associateModeratorToLab);

// Listar todas as associações existentes
router.get('/', authenticateToken, authorizeRoles('ADMIN'), listAssociations);

// Remover uma associação específica (por ID da associação)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), removeAssociation);

// NOVA ROTA: Moderador vê os laboratórios aos quais está vinculado
router.get('/meus-laboratorios', authenticateToken, authorizeRoles('MODERATOR', 'ADMIN'), async (req, res) => {
    try {
        const associacoes = await prisma.moderatorLab.findMany({
            where: { userId: req.user.id },
            include: { lab: true },
        });

        const laboratorios = associacoes.map((a) => a.lab);
        res.json(laboratorios);
    } catch (err) {
        console.error('Erro ao buscar laboratórios do moderador:', err);
        res.status(500).json({ error: 'Erro ao buscar laboratórios do moderador.' });
    }
});

export default router;
