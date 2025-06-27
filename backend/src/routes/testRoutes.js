import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/private', authenticateToken, (req, res) => {
    res.json({ message: `Olá, ${req.user.role}. Você está autenticado!` });
});

router.get('/admin-only', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
    res.json({ message: 'Acesso permitido ao administrador.' });
});

export default router;
