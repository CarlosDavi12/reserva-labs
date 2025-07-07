import prisma from '../config/prismaClient.js';
import { registerAndSendEmail } from '../services/authService.js';
import { createLog } from '../services/logService.js'; // ✅ Adicionado para registrar auditoria
import { traduzirPapel } from '../services/logService.js';

export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true,
                moderatorType: true,
                isActive: true,
                createdAt: true,
                moderatorLabs: {
                    select: { labId: true }
                }
            }
        });
        res.json(usuarios);
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};

export const registerUserByAdminOrCoordinator = async (req, res) => {
    try {
        const userCriador = req.user;
        const resultado = await registerAndSendEmail(req.body, userCriador);
        const novoUsuario = resultado.user;

        await createLog(
            userCriador.id,
            `Cadastrou ${novoUsuario.name} (${novoUsuario.email}) com o papel ${traduzirPapel(novoUsuario.role, novoUsuario.moderatorType)}`
        );

        res.status(201).json(resultado);
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err.message);
        res.status(400).json({ error: err.message });
    }
};

// ✅ Função atualizada com fallback completo
export const listarLogsAuditoria = async (req, res) => {
    try {
        const logs = await prisma.log.findMany({
            orderBy: { timestamp: 'desc' },
        });

        const logsComUsuario = await Promise.all(
            logs.map(async (log) => {
                const user = log.userId
                    ? await prisma.user.findUnique({ where: { id: log.userId } })
                    : null;

                return {
                    id: log.id,
                    acao: log.action,
                    detalhes: log.detalhes || '',
                    timestamp: log.timestamp,
                    userName: user?.name || 'Desconhecido',
                    userEmail: user?.email || 'Não identificado',
                    userRole: user?.role || 'NAO_IDENTIFICADO',
                    userModeratorType: user?.moderatorType || null,
                };
            })
        );

        res.json(logsComUsuario);
    } catch (err) {
        console.error('Erro ao listar logs de auditoria:', err.message);
        res.status(500).json({ error: 'Erro ao buscar logs de auditoria.' });
    }
};
