import prisma from '../config/prismaClient.js';

export const listarUsuariosPermitidosParaCoordenador = async (req, res) => {
    try {
        const coordenadorId = req.user.id;

        // Verifica se o usuário logado é de fato um coordenador
        const coordenador = await prisma.user.findUnique({
            where: { id: coordenadorId },
            include: { moderatorLabs: true }
        });

        if (!coordenador || coordenador.moderatorType !== 'COORDINATOR') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        // Extrai os IDs dos laboratórios aos quais o coordenador está vinculado
        const labIds = coordenador.moderatorLabs.map((ml) => ml.labId);

        // Retorna apenas usuários (solicitantes ou monitores) que estão associados a esses labs
        const usuarios = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'STUDENT' },
                    {
                        role: 'MODERATOR',
                        moderatorType: 'MONITOR',
                        moderatorLabs: {
                            some: { labId: { in: labIds } }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true, // ✅ necessário para verificar ativação
                moderatorType: true,
                moderatorLabs: {
                    where: {
                        labId: { in: labIds }
                    },
                    select: {
                        labId: true
                    }
                }
            }
        });

        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários permitidos:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};
