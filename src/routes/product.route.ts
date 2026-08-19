import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  CreateProductSchema,
  GetAllProductSchema,
  GetProductByIdSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from '../validations/product.validation';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(CreateProductSchema), createProduct);
router.get('/', validate(GetAllProductSchema), getAllProducts);
router.get('/:id', validate(GetProductByIdSchema), getProductById);
router.put('/:id', authorize('ADMIN'), validate(UpdateProductSchema), updateProduct);
router.delete('/:id', authorize('ADMIN'), validate(DeleteProductSchema), deleteProduct);

router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

export default router;


//
