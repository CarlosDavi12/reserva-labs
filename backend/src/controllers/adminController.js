import prisma from '../config/prismaClient.js';

// Função para listar todos os usuários com seus respectivos papéis
export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.json(usuarios);
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};
