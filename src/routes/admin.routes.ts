import { Router } from 'express';
import { protect, admin } from '../middlewares/auth.middleware';
import { AdminController } from '../controllers/admin.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { updateUserSchema } from '../schemas/auth.schema';

const router = Router();

router.use(protect, admin); 

router.get('/stats', AdminController.getDashboardStats);

router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);

router.get('/stock-out-history', AdminController.getAllStockOuts);
router.get('/inventory-value', AdminController.getInventoryValue);
router.post('/invite-user', AdminController.inviteUser);
router.put(
  '/users/:id', 
  validateRequest(updateUserSchema), 
  AdminController.updateUser
);

export default router;