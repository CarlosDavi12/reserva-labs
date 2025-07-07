import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import prisma from '../config/prismaClient.js';
import { listarUsuarios } from '../controllers/adminController.js';

const router = express.Router();

// ✅ Função auxiliar para traduzir o papel do usuário
function traduzirPapel(role, moderatorType) {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'MODERATOR') {
        if (moderatorType === 'COORDINATOR') return 'Coordenador';
        if (moderatorType === 'MONITOR') return 'Monitor';
        return 'Moderador';
    }
    return 'Solicitante';
}

// ✅ Rota correta: listar todos os usuários (com moderatorType incluso)
router.get('/users', authenticateToken, authorizeRoles('ADMIN'), listarUsuarios);

// ✅ Associar moderador a laboratório
router.post('/associar-moderador', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { userId, labId } = req.body;

    if (!userId || !labId) {
        return res.status(400).json({ error: 'userId e labId são obrigatórios.' });
    }

    try {
        const existente = await prisma.moderatorLab.findFirst({
            where: { userId, labId },
        });

        if (existente) {
            return res.status(400).json({ error: 'Este moderador já está associado a esse laboratório.' });
        }

        const associacao = await prisma.moderatorLab.create({
            data: { userId, labId },
        });

        res.status(201).json(associacao);
    } catch (error) {
        console.error('Erro ao associar moderador:', error);
        res.status(500).json({ error: 'Erro interno ao associar moderador.' });
    }
});

// ✅ Excluir usuário (com proteção contra autoexclusão)
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

        const papelTraduzido = traduzirPapel(usuario.role, usuario.moderatorType);

        // Registrar auditoria da exclusão com papel traduzido
        await prisma.log.create({
            data: {
                userId: req.user.id,
                action: `Excluiu o usuário ${usuario.name} (${usuario.email}) do tipo ${papelTraduzido}`
            }
        });

        res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// ✅ Rota para listar logs de auditoria (com nome e email do usuário ou "Desconhecido")
router.get('/auditoria', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const logs = await prisma.log.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { name: true, email: true, role: true, moderatorType: true },
                },
            },
        });

        const logsFormatados = logs.map(log => ({
            id: log.id,
            userName: log.user?.name || 'Desconhecido',
            userEmail: log.user?.email || 'Desconhecido',
            userRole: log.user?.role || 'STUDENT',
            userModeratorType: log.user?.moderatorType || null,
            action: log.action,
            timestamp: log.timestamp,
        }));

        res.json(logsFormatados);
    } catch (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        res.status(500).json({ error: 'Erro ao buscar logs de auditoria.' });
    }
});

export default router;
