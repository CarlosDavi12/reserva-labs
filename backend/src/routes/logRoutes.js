import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { registrarRecaptchaVisivel } from '../controllers/logController.js';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Rota para listagem de logs (já existente)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const logs = await prisma.log.findMany({
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Nova rota para registrar quando o reCAPTCHA se torna visível
router.post('/recaptcha-visivel', registrarRecaptchaVisivel);

export default router;
