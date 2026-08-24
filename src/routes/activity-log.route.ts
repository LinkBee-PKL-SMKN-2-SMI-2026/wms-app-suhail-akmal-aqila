import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import { GetActivityLogsSchema } from '../validations/activity-log.validation';
import { getActivityLogs } from '../controllers/activity-log.controller';
import { AppError } from '../utils/AppError';

const router = Router();

// 1. Terapkan autentikasi global untuk semua endpoint di router ini
router.use(authenticate);

// 2. Endpoint utama untuk mengambil log aktivitas
router.get('/', validate(GetActivityLogsSchema), getActivityLogs);

// 3. Catat error 405 jika method HTTP yang dipanggil tidak diizinkan
router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
