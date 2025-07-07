import express from 'express';
import {
    login,
    register,
    definirSenha,
    cadastroDireto,
    ativarConta,
    solicitarRedefinicaoSenha,
    enviarCodigo2FA,
    verificarCodigo2FA,
    atualizar2FA // ✅ novo controller importado
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

// ✅ Esqueci minha senha - solicitar redefinição
router.post('/solicitar-redefinicao', solicitarRedefinicaoSenha);

// ✅ Novo: Enviar código 2FA por e-mail
router.post('/enviar-2fa', enviarCodigo2FA);

// ✅ Novo: Verificar código 2FA e retornar token
router.post('/verificar-2fa', verificarCodigo2FA);

// ✅ Novo: Ativar ou desativar autenticação 2FA
router.patch('/atualizar-2fa', authenticateToken, atualizar2FA);

export default router;
