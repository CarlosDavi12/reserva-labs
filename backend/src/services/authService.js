import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function register({ name, email, password, role }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já está em uso.');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Aceita somente funções válidas
    const allowedRoles = ['MODERATOR', 'ADMIN'];
    const userRole = allowedRoles.includes(role) ? role : 'STUDENT';

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: userRole,
        },
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

export async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error('Credenciais inválidas.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Credenciais inválidas.');

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: '1h',
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
        },
    };
}
