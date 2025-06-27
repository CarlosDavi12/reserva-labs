import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import prisma from '../config/prismaClient.js';
import { listarUsuarios } from '../controllers/adminController.js';


const router = express.Router();

// ✅ NOVA ROTA: Listar todos os usuários (acesso apenas para ADMIN)
router.get('/users', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// Rota para associar um moderador a um laboratório (acesso apenas para ADMIN)
router.post('/associar-moderador', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { userId, labId } = req.body;

    if (!userId || !labId) {
        return res.status(400).json({ error: 'userId e labId são obrigatórios.' });
    }

    try {
        // Evita duplicidade
        const existente = await prisma.moderatorLab.findFirst({
            where: { userId, labId },
        });

        if (existente) {
            return res.status(400).json({ error: 'Este moderador já está associado a esse laboratório.' });
        }

        const associacao = await prisma.moderatorLab.create({
            data: {
                userId,
                labId,
            },
        });

        res.status(201).json(associacao);
    } catch (error) {
        console.error('Erro ao associar moderador:', error);
        res.status(500).json({ error: 'Erro interno ao associar moderador.' });
    }
});

// Lista todos os usuários com suas funções (ADMIN, MODERATOR, STUDENT etc)
router.get('/users', authenticateToken, authorizeRoles('ADMIN'), listarUsuarios);

// Rota para excluir um usuário (acesso apenas para ADMIN)
router.delete('/users/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await prisma.user.findUnique({ where: { id } });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        if (usuario.id === req.user.id) {
            return res.status(400).json({ error: 'Você não pode excluir a sua própria conta.' });
        }

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});




export default router;
