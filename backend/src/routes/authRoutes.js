import express from 'express';
import {
    login,
    register,
    definirSenha,
    cadastroDireto,
    ativarConta // ✅ novo controller importado
} from '../controllers/authController.js';
import {
    registerUserByAdminOrCoordinator
} from '../controllers/adminController.js';
import {
    authenticateToken,
    authorizeAdminsOrCoordinators
} from '../middlewares/authMiddleware.js';

const router = express.Router();

// 📥 Cadastro via formulário público (com link por e-mail)
router.post('/register', register);

// 🔐 Login
router.post('/login', login);

// 🛡️ Cadastro feito por administradores ou coordenadores
router.post('/register-user', authenticateToken, authorizeAdminsOrCoordinators, registerUserByAdminOrCoordinator);

// ✅ Definir nova senha via link com token
router.post('/definir-senha', definirSenha);

// 🟢 Cadastro público direto com senha (e-mail de ativação é enviado)
router.post('/cadastro-direto', cadastroDireto);

// ✅ NOVO: Link de ativação de conta
router.get('/ativar-conta', ativarConta);

export default router;
