import { Router } from 'express';
import { getStats, getPendingGames, moderateGame, getUsers, deleteUser } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all routes to only Admin role
router.use(authenticate, authorize(['ADMIN']));

router.get('/stats', getStats);
router.get('/pending', getPendingGames);
router.patch('/games/:id/moderate', moderateGame);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

export default router;
