import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function enviarLinkDefinirSenha(email, userId) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Salva o token no banco
    await prisma.passwordResetToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    const link = `${process.env.FRONTEND_URL}/definir-senha/${token}`;

    await transporter.sendMail({
        from: `"ReservaLab" <${process.env.EMAIL_SENDER}>`,
        to: email,
        subject: 'Defina sua senha de acesso ao ReservaLab',
        html: `<p>Olá! Clique no link abaixo para definir sua senha:</p><p><a href="${link}">${link}</a></p>`,
    });
}
