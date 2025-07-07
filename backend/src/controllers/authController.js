import * as authService from '../services/authService.js';
import prisma from '../config/prismaClient.js';
import axios from 'axios';

function validarSenhaForte(senha) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(senha);
}

export async function register(req, res) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function login(req, res) {
    const { recaptchaToken } = req.body;

    if (recaptchaToken) {
        try {
            const resposta = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`,
                null,
                {
                    params: {
                        secret: '6LdwTXorAAAAAJ_FlyEQqjUhndMs7BT1SOZkAawg', // 🔴 Substitua por sua chave secreta
                        response: recaptchaToken,
                    },
                }
            );

            if (!resposta.data.success) {
                // 📝 REGISTRA NA AUDITORIA COM userId: null e email informado
                await prisma.logAuditoria.create({
                    data: {
                        userId: null,
                        userEmail: req.body.email || null,
                        userName: null,
                        acao: `Login bloqueado por falha no reCAPTCHA`,
                        detalhes: `IP: ${req.ip} | Email informado: ${req.body.email}`,
                    },
                });

                return res.status(400).json({ error: 'Verificação do reCAPTCHA falhou.' });
            }

        } catch (error) {
            return res.status(500).json({ error: 'Erro ao verificar o reCAPTCHA.' });
        }
    }

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
    const { token, novaSenha } = req.body;

    if (!validarSenhaForte(novaSenha)) {
        return res.status(400).json({
            error: 'Senha fraca. Ela deve conter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.',
        });
    }

    try {
        const result = await authService.definirSenha({ token, novaSenha });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ Cadastro comum com envio de e-mail para ativação
export async function cadastroDireto(req, res) {
    const { name, email, password } = req.body;

    if (!validarSenhaForte(password)) {
        return res.status(400).json({
            error: 'Senha fraca. Ela deve conter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.',
        });
    }

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

// ✅ Esqueci minha senha - Solicitar redefinição
export async function solicitarRedefinicaoSenha(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'O campo de e-mail é obrigatório.' });
    }

    try {
        const result = await authService.gerarTokenRedefinicaoSenha(email);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ 2FA - Gerar e enviar código por e-mail
export async function enviarCodigo2FA(req, res) {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        const result = await authService.gerarEEnviarCodigo2FA(userId);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ 2FA - Verificar código e retornar token
export async function verificarCodigo2FA(req, res) {
    const { userId, code } = req.body;

    if (!userId || !code) {
        return res.status(400).json({ error: 'ID do usuário e código são obrigatórios.' });
    }

    try {
        const result = await authService.verificarCodigo2FA(userId, code);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// ✅ 2FA - Ativar ou desativar autenticação de dois fatores
export async function atualizar2FA(req, res) {
    const { habilitar } = req.body;
    const userId = req.user?.id;

    if (typeof habilitar !== 'boolean') {
        return res.status(400).json({ error: 'O campo "habilitar" deve ser true ou false.' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    try {
        const result = await authService.atualizarTwoFactor(userId, habilitar);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}
