import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { RegisterSchema, LoginSchema } from '../validations/auth.validation';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);
router.get('/me', authenticate, getMe);

export default router;

// intinya kode di atas adalah untuk membuat route endpoint untuk register, login, dan getMe,
// dimana setiap request yang masuk akan divalidasi menggunakan schema yang sudah dibuat sebelumnya,
// jika valid maka akan diteruskan ke controller untuk diproses lebih lanjut.
