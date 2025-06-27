// limparDados.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!admin) {
        console.log('Nenhum administrador encontrado. Cancelando operação.');
        return;
    }

    // Passo 1: Deletar todas as associações e reservas que dependem de users e labs
    await prisma.moderatorLab.deleteMany();
    await prisma.reservation.deleteMany();

    // Passo 2: Deletar os laboratórios
    await prisma.lab.deleteMany();

    // Passo 3: Deletar os usuários, exceto o admin
    await prisma.user.deleteMany({
        where: { NOT: { id: admin.id } }
    });

    console.log('Todos os dados foram apagados com sucesso, exceto o administrador.');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
