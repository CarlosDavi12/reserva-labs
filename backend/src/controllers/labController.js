import { createLog, traduzirPapel } from '../services/logService.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createLab(req, res) {
    try {
        const { name, description } = req.body;

        // 👇 Log do arquivo recebido para debug
        console.log('🧾 req.file:', req.file);

        // ✅ Captura robusta da URL da imagem
        const imageUrl = req.file?.path || req.file?.secure_url || null;
        console.log('🌐 imageUrl extraída:', imageUrl);

        const lab = await prisma.lab.create({
            data: {
                name,
                description,
                imageUrl,
            },
        });

        await createLog(req.user.id, `Criou o laboratório "${name}"`);

        res.status(201).json(lab);
    } catch (err) {
        console.error('❌ Erro ao criar laboratório:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

        if (err.message && err.message.includes('File too large')) {
            return res.status(400).json({ error: 'A imagem enviada é muito grande. O tamanho máximo permitido é 5MB.' });
        }

        res.status(400).json({ error: 'Erro ao criar laboratório. Verifique os logs.' });
    }
}

export async function listLabs(req, res) {
    try {
        const labs = await prisma.lab.findMany({
            include: {
                moderatorLabs: {
                    include: {
                        user: true
                    }
                },
                reservations: {
                    orderBy: { start: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
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

export async function atribuirUsuarioAoLab(req, res) {
    const { labId } = req.params;
    const { userId } = req.body;
    const solicitante = req.user;

    try {
        const usuario = await prisma.user.findUnique({ where: { id: userId } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        if (usuario.role !== 'MODERATOR') {
            return res.status(400).json({ error: 'Apenas usuários moderadores podem ser vinculados.' });
        }

        if (solicitante.role === 'ADMIN') {
            // ok
        } else if (
            solicitante.role === 'MODERATOR' &&
            solicitante.moderatorType === 'COORDINATOR'
        ) {
            if (usuario.moderatorType !== 'MONITOR') {
                return res.status(403).json({ error: 'Coordenadores só podem vincular monitores.' });
            }

            const vinculo = await prisma.moderatorLab.findFirst({
                where: {
                    userId: solicitante.id,
                    labId
                }
            });

            if (!vinculo) {
                return res.status(403).json({ error: 'Você não pode gerenciar este laboratório.' });
            }
        } else {
            return res.status(403).json({ error: 'Permissão negada.' });
        }

        const jaExiste = await prisma.moderatorLab.findUnique({
            where: {
                userId_labId: {
                    userId,
                    labId
                }
            }
        });

        if (jaExiste) {
            return res.status(400).json({ error: 'Usuário já está vinculado a este laboratório.' });
        }

        const associacao = await prisma.moderatorLab.create({
            data: {
                userId,
                labId
            }
        });

        const lab = await prisma.lab.findUnique({ where: { id: labId } });

        await createLog(
            solicitante.id,
            `Vinculou ${usuario.name} (${usuario.email}) com o papel ${traduzirPapel(usuario.role, usuario.moderatorType)} ao laboratório "${lab?.name || labId}"`
        );

        return res.status(201).json({ message: 'Usuário vinculado com sucesso.', associacao });
    } catch (err) {
        console.error('Erro ao vincular usuário ao laboratório:', err);
        return res.status(500).json({ error: 'Erro ao vincular usuário.' });
    }
}

export async function removerUsuarioDoLab(req, res) {
    const { labId, userId } = req.params;
    const solicitante = req.user;

    try {
        const vinculo = await prisma.moderatorLab.findUnique({
            where: {
                userId_labId: {
                    userId,
                    labId
                }
            },
            include: { user: true }
        });

        if (!vinculo) {
            return res.status(404).json({ error: 'Vínculo não encontrado.' });
        }

        const usuario = vinculo.user;

        if (solicitante.role === 'ADMIN') {
            // ok
        } else if (
            solicitante.role === 'MODERATOR' &&
            solicitante.moderatorType === 'COORDINATOR'
        ) {
            if (usuario.moderatorType !== 'MONITOR') {
                return res.status(403).json({ error: 'Coordenadores só podem remover monitores.' });
            }

            const ehDoMesmoLab = await prisma.moderatorLab.findFirst({
                where: {
                    userId: solicitante.id,
                    labId
                }
            });

            if (!ehDoMesmoLab) {
                return res.status(403).json({ error: 'Você não pode remover usuários deste laboratório.' });
            }
        } else {
            return res.status(403).json({ error: 'Permissão negada.' });
        }

        await prisma.moderatorLab.delete({
            where: {
                userId_labId: {
                    userId,
                    labId
                }
            }
        });

        const laboratorio = await prisma.lab.findUnique({ where: { id: labId } });

        await createLog(
            solicitante.id,
            `Removeu ${usuario.name} (${usuario.email}) com o papel ${traduzirPapel(usuario.role, usuario.moderatorType)} do laboratório "${laboratorio?.name || labId}"`
        );

        return res.json({ message: 'Usuário removido do laboratório com sucesso.' });

    } catch (err) {
        console.error('Erro ao remover usuário do laboratório:', err);
        return res.status(500).json({ error: 'Erro ao remover vínculo.' });
    }
}
