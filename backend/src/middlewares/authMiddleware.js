import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const { role } = req.user;
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    };
}

// ✅ Novo middleware: permite ADMIN e COORDENADOR (moderatorType === 'COORDINATOR')
export function authorizeAdminsOrCoordinators(req, res, next) {
    const { role, moderatorType } = req.user;

    if (role === 'ADMIN') return next();
    if (role === 'MODERATOR' && moderatorType === 'COORDINATOR') return next();

    return res.status(403).json({ error: 'Apenas administradores ou coordenadores têm acesso.' });
}
