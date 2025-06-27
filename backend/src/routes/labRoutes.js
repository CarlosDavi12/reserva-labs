import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { createLab, listLabs, deleteLab } from '../controllers/labController.js';
import { upload } from '../middlewares/uploadMiddleware.js'; // 👈 importa o middleware

const router = express.Router();

// Aceita um upload de imagem via multipart/form-data
router.post(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    upload.single('image'), // middleware do multer para 1 imagem
    createLab
);

router.get('/', authenticateToken, listLabs);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteLab);

export default router;
