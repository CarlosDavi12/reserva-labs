import { createLog } from '../services/logService.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createLab(req, res) {
    const { name, description } = req.body;
    const image = req.file;

    try {
        const lab = await prisma.lab.create({
            data: {
                name,
                description,
                imageUrl: image ? `/uploads/${image.filename}` : null,
            },
        });

        await createLog(req.user.id, `Criou o laboratório "${name}"`);

        res.status(201).json(lab);
    } catch (err) {
        console.error('Erro ao criar laboratório:', err);
        res.status(400).json({ error: err.message });
    }
}

export async function listLabs(req, res) {
    try {
        const labs = await prisma.lab.findMany();
        res.json(labs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteLab(req, res) {
    const { id } = req.params;

    try {
        const lab = await prisma.lab.findUnique({ where: { id } });

        if (!lab) {
            return res.status(404).json({ error: 'Laboratório não encontrado.' });
        }

        await prisma.lab.delete({ where: { id } });

        await createLog(req.user.id, `Excluiu o laboratório "${lab.name}"`);

        res.json({ message: 'Laboratório excluído com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir laboratório.' });
    }
}
