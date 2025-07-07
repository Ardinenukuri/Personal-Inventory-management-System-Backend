import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, admin, CategoryController.createCategory);
router.get('/', protect, CategoryController.getAllCategories);

export default router;