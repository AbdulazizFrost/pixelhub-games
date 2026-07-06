import { Router } from 'express';
import { addReview, toggleLike, addComment, getComments, createAchievement, unlockAchievement } from '../controllers/interactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:id/reviews', authenticate, addReview);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', getComments);
router.post('/achievements', authenticate, createAchievement);
router.post('/achievements/unlock', authenticate, unlockAchievement);

export default router;
