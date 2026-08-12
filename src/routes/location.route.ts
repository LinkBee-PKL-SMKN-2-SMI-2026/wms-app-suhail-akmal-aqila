import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  createCategorySchema,
  getAllCategoriesSchema,
  getCategoryByIdSchema,
  updateCategorySchema,
  deleteCategorySchema,
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

router.post('/', authorize('ADMIN'), validate(createCategorySchema), createCategory);
router.get('/', validate(getAllCategoriesSchema), getAllCategories);
router.get('/:id', validate(getCategoryByIdSchema), getCategoryById);
router.put('/:id', authorize('ADMIN'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', authorize('ADMIN'), validate(deleteCategorySchema), deleteCategory);

router.all('*', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;
