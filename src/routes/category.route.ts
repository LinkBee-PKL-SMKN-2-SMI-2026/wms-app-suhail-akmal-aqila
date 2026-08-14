import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(CreateCategorySchema), createCategory);
router.get('/', validate(GetAllCategorySchema), getAllCategories);
router.get('/:id', validate(GetCategoryByIdSchema), getCategoryById);
router.put('/:id', authorize('ADMIN'), validate(UpdateCategorySchema), updateCategory);
router.delete('/:id', authorize('ADMIN'), validate(DeleteCategorySchema), deleteCategory);

router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
