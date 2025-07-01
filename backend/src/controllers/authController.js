import * as authService from '../services/authService.js';

export async function register(req, res) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function login(req, res) {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}

// ✅ Cadastro feito por admin ou coordenador, com envio de e-mail
export async function adminRegister(req, res) {
    try {
        const result = await authService.registerAndSendEmail(req.body, req.user);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ Novo: Definição de senha via link (token)
export async function definirSenha(req, res) {
    try {
        const result = await authService.definirSenha(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ Cadastro comum com envio de e-mail para ativação
export async function cadastroDireto(req, res) {
    const { name, email, password } = req.body;

    try {
        const result = await authService.cadastroDireto({ name, email, password });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ NOVO: Ativação da conta com token de e-mail
export async function ativarConta(req, res) {
    const { token } = req.query;

    try {
        const result = await authService.ativarContaPorToken(token);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}
