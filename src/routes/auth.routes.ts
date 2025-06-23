import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema, resetPasswordSchema, forgotPasswordSchema, changePasswordSchema, updateProfileSchema, completeRegistrationSchema } from '../schemas/auth.schema';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.registerUser);
router.post('/login', validateRequest(loginSchema), AuthController.loginUser);
router.get('/verify/:token', AuthController.verifyEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.put('/reset-password/:token', validateRequest(resetPasswordSchema), AuthController.resetPassword);

router.put(
    '/complete-registration/:token', 
    validateRequest(completeRegistrationSchema), 
    AuthController.completeRegistration
);
router.use(protect);

router.put('/change-password', validateRequest(changePasswordSchema), AuthController.changePassword);
router.get('/profile', AuthController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), AuthController.updateProfile);


export default router;