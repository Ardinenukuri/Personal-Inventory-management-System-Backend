import { Router } from 'express';
import { protect, admin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { InventoryController } from '../controllers/inventory.controller';
import { stockInSchema, stockOutSchema } from '../schemas/inventory.schema';

const router = Router();
router.use(protect);
router.post('/stock-in', admin, validateRequest(stockInSchema), InventoryController.stockIn);
router.post('/stock-out', validateRequest(stockOutSchema), InventoryController.stockOut);
export default router;