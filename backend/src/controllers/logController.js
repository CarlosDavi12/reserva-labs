import prisma from '../config/prismaClient.js';

export const registrarRecaptchaVisivel = async (req, res) => {
    const { email } = req.body;

    try {
        await prisma.log.create({
            data: {
                userId: null,
                action: 'reCAPTCHA exibido após múltiplas tentativas de login',
                detalhes: `Email informado: ${email} | IP: ${req.ip}`,
            },
        });

        res.status(201).json({ message: 'Log de reCAPTCHA visível registrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao registrar log de reCAPTCHA visível:', error);
        res.status(500).json({ error: 'Erro ao registrar log de reCAPTCHA visível.' });
    }
};
