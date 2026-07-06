import { Router } from 'express';
import { register, login, getMe, getProfile, updateProfile, toggleSubscribe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/profile/:username', getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/subscribe', authenticate, toggleSubscribe);

export default router;
