import { Router } from 'express';
import { matchTutorsForStudent } from '../controllers/matchingController';
import { verifyToken, checkBlacklistedToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/match/:studentId', verifyToken, checkBlacklistedToken, matchTutorsForStudent);

export default router;