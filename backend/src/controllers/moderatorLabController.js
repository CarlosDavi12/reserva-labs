import prisma from '../config/prismaClient.js';
import { createLog } from '../services/logService.js'; // 🆕 Para salvar o log

export const associateModeratorToLab = async (req, res) => {
    const { userId, labId } = req.body;

    if (!userId || !labId) {
        return res.status(400).json({ error: 'userId e labId são obrigatórios.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'MODERATOR') {
            return res.status(400).json({ error: 'Usuário inválido ou não é moderador.' });
        }

        const lab = await prisma.lab.findUnique({ where: { id: labId } });
        if (!lab) {
            return res.status(400).json({ error: 'Laboratório não encontrado.' });
        }

        const association = await prisma.moderatorLab.create({
            data: {
                userId,
                labId,
            },
        });

        await createLog(req.user.id, `Associou o moderador "${user.name}" ao laboratório "${lab.name}".`);

        return res.status(201).json(association);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao associar moderador ao laboratório.' });
    }
};

export const listAssociations = async (req, res) => {
    try {
        const associacoes = await prisma.moderatorLab.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                lab: { select: { id: true, name: true } }
            }
        });

        res.json(associacoes);
    } catch (error) {
        console.error('Erro ao buscar associações:', error);
        res.status(500).json({ error: 'Erro ao buscar associações.' });
    }
};

export const removeAssociation = async (req, res) => {
    const { id } = req.params;

    try {
        const associacao = await prisma.moderatorLab.findUnique({
            where: { id },
            include: {
                user: true,
                lab: true,
            },
        });

        if (!associacao) {
            return res.status(404).json({ error: 'Associação não encontrada.' });
        }

        await prisma.moderatorLab.delete({ where: { id } });

        await createLog(
            req.user.id,
            `Removeu a associação do moderador "${associacao.user.name}" com o laboratório "${associacao.lab.name}".`
        );

        res.json({ message: 'Associação removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover associação:', error);
        res.status(500).json({ error: 'Erro ao remover associação.' });
    }
};

// ✅ NOVA FUNÇÃO: Retornar laboratórios associados ao moderador logado
export const getLabsByModerator = async (req, res) => {
    try {
        const associacoes = await prisma.moderatorLab.findMany({
            where: { userId: req.user.id },
            include: { lab: true },
        });

        const laboratorios = associacoes.map((a) => a.lab);
        res.json(laboratorios);
    } catch (error) {
        console.error('Erro ao buscar laboratórios do moderador:', error);
        res.status(500).json({ error: 'Erro ao buscar laboratórios do moderador.' });
    }
};
