import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getMe, updateMe,
  requestPasswordChange, confirmPasswordChange
} from '../controllers/profile.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/me', getMe);
router.put('/me', updateMe);

router.post('/me/password/request', requestPasswordChange);
router.post('/me/password/confirm', confirmPasswordChange);

export default router;
