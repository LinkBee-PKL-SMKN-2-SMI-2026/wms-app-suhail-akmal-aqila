import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import {
  CreateInboundSchema,
  CreateOutboundSchema,
  GetMovementHistorySchema,
} from '../validations/stock-movement.validation';
import {
  createInbound,
  createOutbound,
  getMovementHistory,
} from '../controllers/stock-movement.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router.post('/inbound', validate(CreateInboundSchema), createInbound);
router.post('/outbound', validate(CreateOutboundSchema), createOutbound);
router.get('/history', validate(GetMovementHistorySchema), getMovementHistory);

router.all('*', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
