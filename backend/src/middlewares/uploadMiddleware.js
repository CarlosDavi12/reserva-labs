import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante caminho correto, mesmo usando ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });
