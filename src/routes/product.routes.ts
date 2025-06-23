import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { protect, admin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

router.use(protect);

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

router.post('/', admin, validateRequest(createProductSchema), ProductController.createProduct);
router.put('/:id', admin, validateRequest(updateProductSchema), ProductController.updateProduct);
router.delete('/:id', admin, ProductController.deleteProduct);

export default router;