import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createLog(userId, action) {
    try {
        await prisma.log.create({
            data: {
                userId,
                action,
            },
        });
    } catch (error) {
        console.error('Erro ao registrar log:', error.message);
    }
}
