import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import testRoutes from './routes/testRoutes.js';
import labRoutes from './routes/labRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import logRoutes from './routes/logRoutes.js';
import moderatorLabRoutes from './routes/moderatorLabRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import coordenadorRoutes from './routes/coordenadorRoutes.js';

import { authenticateToken, authorizeRoles } from './middlewares/authMiddleware.js';
import { getLabsByModerator } from './controllers/moderatorLabController.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Resolver caminhos (compatível com ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Servir arquivos da pasta uploads corretamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas principais
app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/labs', labRoutes);
app.use('/reservations', reservationRoutes);
app.use('/logs', logRoutes);
app.use('/moderator-labs', moderatorLabRoutes);
app.use('/admin', adminRoutes);
app.use('/coordenador', coordenadorRoutes);

// Nova rota: laboratórios associados a um moderador
app.get('/moderador/meus-laboratorios', authenticateToken, authorizeRoles('MODERATOR'), getLabsByModerator);

// Rota raiz
app.get('/', (req, res) => {
    res.send('API funcionando!');
});

// Inicialização do servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
