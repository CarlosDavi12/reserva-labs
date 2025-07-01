import prisma from '../config/prismaClient.js';
import { registerAndSendEmail } from '../services/authService.js';

// ✅ Função para listar todos os usuários com seus respectivos papéis
export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true, // ✅ Adicionado para verificar se já definiu a senha
                moderatorType: true,
                isActive: true,
                createdAt: true,
                moderatorLabs: {
                    select: {
                        labId: true
                    }
                }
            }
        });

        res.json(usuarios);
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};

// ✅ Nova função para cadastro via admin ou coordenador
export const registerUserByAdminOrCoordinator = async (req, res) => {
    try {
        const userCriador = req.user; // vem do middleware authenticateToken
        const novoUsuario = await registerAndSendEmail(req.body, userCriador);
        res.status(201).json(novoUsuario);
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err.message);
        res.status(400).json({ error: err.message });
    }
};
