// src/routes/stock.routes.ts
import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { stockOutSchema } from '../schemas/stock.schema';

const router = Router();

router.use(protect);

router.post('/out', validateRequest(stockOutSchema), StockController.stockOut);


export default router;