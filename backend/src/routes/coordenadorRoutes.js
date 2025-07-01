import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { listarUsuariosPermitidosParaCoordenador } from '../controllers/coordenadorController.js';
import { getReservationsByModerator } from '../controllers/reservationController.js';

const router = express.Router();

// 🔒 Coordenador: listar apenas usuários permitidos (como monitores e solicitantes)
router.get('/usuarios-permitidos', authenticateToken, authorizeRoles('MODERATOR'), listarUsuariosPermitidosParaCoordenador);

// 🔒 Coordenador: obter reservas dos laboratórios aos quais está vinculado
router.get('/reservations', authenticateToken, authorizeRoles('MODERATOR'), getReservationsByModerator);

export default router;
