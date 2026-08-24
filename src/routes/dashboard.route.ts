import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import {
  GetDashboardStatsSchema,
  GetRecentMovementsSchema,
} from '../validations/dashboard.validation';
import { getDashboardStats, getRecentMovements } from '../controllers/dashboard.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router.get('/stats', validate(GetDashboardStatsSchema), getDashboardStats);
router.get('/recent-movements', validate(GetRecentMovementsSchema), getRecentMovements);

router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
