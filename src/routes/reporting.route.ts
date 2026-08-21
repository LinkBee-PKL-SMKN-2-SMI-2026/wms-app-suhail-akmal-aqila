import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { GetSummarySchema, GetLowStockSchema } from '../validations/reporting.validation';
import { getSummary, getLowStock } from '../controllers/reporting.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

// Pasang middleware authenticate secara global untuk semua route di file ini
router.use(authenticate);

router.get('/summary', validate(GetSummarySchema), getSummary);
router.get('/low-stock', validate(GetLowStockSchema), getLowStock);

// Handle HTTP method yang tidak sesuai/diizinkan pada route /reports/*
router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
