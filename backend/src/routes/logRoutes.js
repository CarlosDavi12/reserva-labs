import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();
const router = express.Router();

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

export default router;
