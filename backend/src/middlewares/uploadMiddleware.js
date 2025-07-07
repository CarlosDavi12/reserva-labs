import multer from 'multer';
import { storage } from '../config/cloudinary.js';

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(new Error('Formato de imagem inválido. Use JPG ou PNG.'));
        }
        cb(null, true);
    }
});
