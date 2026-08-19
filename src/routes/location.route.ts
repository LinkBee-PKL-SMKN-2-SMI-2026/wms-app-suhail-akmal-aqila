import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  CreateLocationSchema,
  GetAllLocationSchema,
  GetLocationByIdSchema,
  UpdateLocationSchema,
  DeleteLocationSchema,
} from '../validations/location.validation';
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from '../controllers/location.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(CreateLocationSchema), createLocation);
router.get('/', validate(GetAllLocationSchema), getAllLocations);
router.get('/:id', validate(GetLocationByIdSchema), getLocationById);
router.put('/:id', authorize('ADMIN'), validate(UpdateLocationSchema), updateLocation);
router.delete('/:id', authorize('ADMIN'), validate(DeleteLocationSchema), deleteLocation);

router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;

//.
