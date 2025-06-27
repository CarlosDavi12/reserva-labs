import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'carlos@example.com'; // <-- Troque aqui pelo seu email

    const updatedUser = await prisma.user.update({
        where: { email },
        data: {
            role: 'ADMIN',
        },
    });

    console.log('Usuário promovido:', updatedUser);
}

main()
    .catch((e) => {
        console.error('Erro ao promover usuário:', e.message);
    })
    .finally(() => prisma.$disconnect());
