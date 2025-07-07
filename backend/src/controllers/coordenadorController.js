import prisma from '../config/prismaClient.js';

export const listarUsuariosPermitidosParaCoordenador = async (req, res) => {
    try {
        const userId = req.user.id; // Pegar o ID do usuário logado (pode ser coordenador ou monitor)
        const userRole = req.user.role;
        const userModeratorType = req.user.moderatorType;

        // Buscar o usuário logado para obter os laboratórios vinculados
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { moderatorLabs: true }
        });

        // Este if verifica se o usuário é um moderador. A autorização já deveria ter feito isso,
        // mas é uma validação extra. Podemos mantê-lo ou refinar.
        if (!currentUser || userRole !== 'MODERATOR') {
            return res.status(403).json({ error: 'Acesso negado: Usuário não é um moderador.' });
        }

        // Extrai os IDs dos laboratórios aos quais o usuário logado está vinculado
        const labIds = currentUser.moderatorLabs.map((ml) => ml.labId);

        // Se o usuário logado é um MONITOR, ele só pode ver os usuários do SEU PRÓPRIO laboratório.
        // Se for um COORDENADOR, ele pode ver todos os moderadores (coordenadores e monitores)
        // e estudantes vinculados aos seus laboratórios.
        let queryConditions = [];

        // Para coordenadores, a lógica é a que já estava funcionando
        if (userModeratorType === 'COORDINATOR') {
            queryConditions = [
                { role: 'STUDENT' }, // Inclui todos os estudantes
                {
                    role: 'MODERATOR',
                    moderatorType: 'MONITOR', // Inclui monitores vinculados a estes labs
                    moderatorLabs: {
                        some: { labId: { in: labIds } }
                    }
                },
                { // Inclui COORDENADORES vinculados a estes labs (exceto o próprio usuário logado, se desejar)
                    role: 'MODERATOR',
                    moderatorType: 'COORDINATOR',
                    moderatorLabs: {
                        some: { labId: { in: labIds } }
                    }
                }
            ];
        } else if (userModeratorType === 'MONITOR') {
            // Para monitores, eles só devem ver:
            // 1. Eles mesmos (opcional, mas útil para o frontend)
            // 2. Os coordenadores dos seus próprios laboratórios
            // 3. Outros monitores dos seus próprios laboratórios
            // 4. Estudantes dos seus próprios laboratórios
            queryConditions = [
                { id: userId }, // O próprio monitor
                {
                    role: 'MODERATOR',
                    moderatorLabs: {
                        some: { labId: { in: labIds } } // Qualquer moderador (monitor ou coordenador) nos mesmos labs
                    }
                },
                {
                    role: 'STUDENT',
                    reservations: { // Estudantes que fizeram reservas nos labs do monitor
                        some: { labId: { in: labIds } }
                    }
                }
            ];
        } else {
            // Caso caia aqui, significa um role MODERATOR sem moderatorType específico, o que não deveria acontecer.
            return res.status(403).json({ error: 'Tipo de moderador não reconhecido.' });
        }


        const usuarios = await prisma.user.findMany({
            where: {
                OR: queryConditions
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true,
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