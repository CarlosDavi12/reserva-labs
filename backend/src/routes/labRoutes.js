import express from 'express';
import {
    authenticateToken,
    authorizeRoles
} from '../middlewares/authMiddleware.js';
import {
    createLab,
    listLabs,
    deleteLab,
    atribuirUsuarioAoLab,
    removerUsuarioDoLab
} from '../controllers/labController.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// 📸 Criar laboratório (com upload de imagem)
router.post(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    upload.single('image'),
    createLab
);

// 📋 Listar laboratórios (agora com reservas e usuários vinculados)
router.get('/', authenticateToken, listLabs);

// 🗑️ Deletar laboratório
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteLab);

// 🟢 Atribuir usuário (coordenador ou monitor) a um laboratório
router.post('/:labId/usuarios', authenticateToken, atribuirUsuarioAoLab);

// 🔴 Remover usuário (coordenador ou monitor) de um laboratório
router.delete('/:labId/usuarios/:userId', authenticateToken, removerUsuarioDoLab);

export default router;
