import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// ✅ Cadastro de usuário feito por coordenador ou admin
export async function register({ name, email, role, moderatorType }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já está em uso.');

    const allowedRoles = ['MODERATOR', 'ADMIN'];
    const userRole = allowedRoles.includes(role) ? role : 'STUDENT';

    const userData = {
        name,
        email,
        password: '', // será definida depois
        role: userRole,
    };

    if (userRole === 'MODERATOR') {
        userData.moderatorType = moderatorType === 'COORDENADOR' ? 'COORDINATOR' : 'MONITOR';
    }

    const user = await prisma.user.create({ data: userData });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
    });

    const link = `http://localhost:5173/definir-senha?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Cadastro - Defina sua Senha no ReservaLab',
        html: `
            <p>Olá, ${user.name}!</p>
            <p>Você foi cadastrado no sistema ReservaLab. Para definir sua senha, clique no link abaixo:</p>
            <a href="${link}">${link}</a>
            <p>Esse link é válido por 1 hora.</p>
        `,
    });

    return {
        message: 'Usuário cadastrado com sucesso. E-mail de definição de senha enviado.',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            moderatorType: user.moderatorType ?? null,
        },
    };
}

// ✅ Cadastro via admin/coordenador (com verificação de permissões)
export async function registerAndSendEmail({ name, email, role, moderatorType }, userCriador) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já está em uso.');

    if (userCriador.role === 'ADMIN') {
        if (!['STUDENT', 'MODERATOR', 'ADMIN'].includes(role)) {
            throw new Error('Papel inválido.');
        }
    } else if (userCriador.role === 'MODERATOR' && userCriador.moderatorType === 'COORDINATOR') {
        if (!['STUDENT', 'MODERATOR'].includes(role)) {
            throw new Error('Coordenadores só podem cadastrar estudantes ou monitores.');
        }
    } else {
        throw new Error('Você não tem permissão para cadastrar usuários.');
    }

    const userData = {
        name,
        email,
        password: '',
        role,
        isActive: true,
    };

    if (role === 'MODERATOR') {
        userData.moderatorType = moderatorType === 'COORDENADOR' ? 'COORDINATOR' : 'MONITOR';
    }

    const newUser = await prisma.user.create({ data: userData });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
        data: { userId: newUser.id, token, expiresAt },
    });

    const link = `http://localhost:5173/definir-senha?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Bem-vindo ao ReservaLab – Defina sua senha',
        html: `
            <p>Olá, ${name}!</p>
            <p>Você foi cadastrado no sistema ReservaLab.</p>
            <p>Para criar sua senha e ativar sua conta, clique no link abaixo:</p>
            <a href="${link}">${link}</a>
            <p>Esse link é válido por 1 hora.</p>
        `,
    });

    return {
        message: 'Usuário criado com sucesso. E-mail enviado.',
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            moderatorType: newUser.moderatorType ?? null,
        },
    };
}

// ✅ Login
export async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error('Credenciais inválidas.');
    if (!user.isActive) throw new Error('Sua conta ainda não foi ativada. Verifique seu e-mail para ativar.');
    if (!user.password) throw new Error('Senha não definida. Verifique seu e-mail.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Credenciais inválidas.');

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            moderatorType: user.moderatorType ?? null,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            moderatorType: user.moderatorType ?? null,
        },
    };
}

// ✅ Requisição de redefinição de senha
export async function solicitarRedefinicaoSenha(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Usuário não encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            token,
            expiresAt,
        },
    });

    const link = `http://localhost:5173/definir-senha?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Redefinição de Senha - ReservaLab',
        html: `
            <p>Olá, ${user.name}!</p>
            <p>Para definir sua nova senha, clique no link abaixo:</p>
            <a href="${link}">${link}</a>
            <p>Esse link é válido por 1 hora.</p>
        `,
    });

    return { message: 'E-mail de redefinição de senha enviado com sucesso.' };
}

// ✅ Definir nova senha com token
export async function definirSenha({ token, novaSenha }) {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new Error('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
        where: { id: resetToken.userId },
        data: {
            password: hashedPassword,
            isActive: true,
        },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Senha definida com sucesso.' };
}

// ✅ Cadastro comum com senha definida no formulário + ativação por e-mail
export async function cadastroDireto({ name, email, password }) {
    if (!name || !email || !password) {
        throw new Error('Todos os campos são obrigatórios.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já está em uso.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: false,
        },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
        data: {
            userId: newUser.id,
            token,
            expiresAt,
        },
    });

    const link = `http://localhost:5173/ativar-conta?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Ative sua conta no ReservaLab',
        html: `
            <p>Olá, ${name}!</p>
            <p>Seu cadastro foi realizado com sucesso.</p>
            <p>Para ativar sua conta, clique no link abaixo:</p>
            <a href="${link}">${link}</a>
            <p>Esse link é válido por 1 hora.</p>
        `,
    });

    return {
        message: 'Usuário criado. Verifique seu e-mail para ativar a conta.',
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        },
    };
}

// ✅ Ativação de conta via link (usuário comum que já definiu senha)
export async function ativarContaPorToken(token) {
    const tokenEntry = await prisma.passwordResetToken.findUnique({
        where: { token },
    });

    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
        throw new Error('Token inválido ou expirado.');
    }

    await prisma.user.update({
        where: { id: tokenEntry.userId },
        data: { isActive: true },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Conta ativada com sucesso.' };
}
