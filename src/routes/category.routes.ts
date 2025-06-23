import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, admin, CategoryController.createCategory);

export default router;