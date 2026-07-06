import { Router } from 'express';
import { createGame, getGames, getGameBySlug, updateGame, uploadNewVersion, incrementPlays, deleteGame, getCategories } from '../controllers/gameController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

const uploadFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'screenshots', maxCount: 6 },
  { name: 'zipFile', maxCount: 1 }
]);

router.get('/', getGames);
router.get('/categories', getCategories);
router.get('/:slug', getGameBySlug);
router.post('/', authenticate, authorize(['DEVELOPER', 'ADMIN']), uploadFields, createGame);
router.put('/:id', authenticate, authorize(['DEVELOPER', 'ADMIN']), uploadFields, updateGame);
router.post('/:id/version', authenticate, authorize(['DEVELOPER', 'ADMIN']), uploadFields, uploadNewVersion);
router.post('/:id/play', incrementPlays); // public endpoint to increment play count, authenticated user updates play history inside
router.delete('/:id', authenticate, authorize(['DEVELOPER', 'ADMIN']), deleteGame);

export default router;
