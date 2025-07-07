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

export function traduzirPapel(role, moderatorType = null) {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'MODERATOR' && moderatorType === 'COORDINATOR') return 'Coordenador';
    if (role === 'MODERATOR' && moderatorType === 'MONITOR') return 'Monitor';
    if (role === 'STUDENT') return 'Solicitante';
    return 'Desconhecido';
}
