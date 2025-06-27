import express from 'express';
import {
    associateModeratorToLab,
    listAssociations,
    removeAssociation
} from '../controllers/moderatorLabController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔐 Requer ADMIN para todas as ações abaixo

// Criar associação entre moderador e laboratório
router.post('/', authenticateToken, authorizeRoles('ADMIN'), associateModeratorToLab);

// Listar todas as associações existentes
router.get('/', authenticateToken, authorizeRoles('ADMIN'), listAssociations);

// Remover uma associação específica (por ID da associação)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), removeAssociation);

export default router;
