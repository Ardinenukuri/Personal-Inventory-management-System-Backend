import { Router } from 'express';
import { protect, admin } from '../middlewares/auth.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.use(protect, admin); 

router.get('/stats', AdminController.getDashboardStats);

router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);

router.get('/stock-out-history', AdminController.getAllStockOuts);
router.get('/inventory-value', AdminController.getInventoryValue);
router.post('/invite-user', AdminController.inviteUser);

export default router;