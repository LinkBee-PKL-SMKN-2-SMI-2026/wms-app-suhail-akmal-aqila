import { Router } from 'express';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import locationRoute from './location.route';
import productRoute from './product.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/categories', categoryRoute);
router.use('/locations', locationRoute);
router.use('/products', productRoute);

export default router;

//intinya dia manggil route yang ada di folder routes, terus di export ke index.ts ini, jadi nanti di app.ts bisa langsung manggil index.ts ini aja
