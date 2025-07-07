import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { AlertController } from '../controllers/alert.controller';

const router = Router();
router.use(protect); 

router.get('/', AlertController.getAlerts);
router.put('/:id/read', AlertController.markRead);
router.put('/read-all', AlertController.markAllRead);
router.delete('/:id', AlertController.deleteAlert);

export default router;