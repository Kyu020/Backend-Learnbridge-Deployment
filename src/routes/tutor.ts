import { Router } from "express";
import { createTutorProfile, toggleTutorMode, getAllTutorProfile, getTutorProfile, verifyMyTutorProfile, updateTutorProfile } from "../controllers/tutorController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router();

router.post('/createtutor', verifyToken, checkBlacklistedToken, createTutorProfile);
router.put('/updatetutor', verifyToken, checkBlacklistedToken, updateTutorProfile)
router.get('/getalltutor', verifyToken, checkBlacklistedToken, getAllTutorProfile);
router.get('/gettutor/:studentId', verifyToken, checkBlacklistedToken, getTutorProfile)
router.put('/toggletutormode/:studentId', verifyToken, checkBlacklistedToken, toggleTutorMode);
router.get('/verifytutorprofile', verifyToken, checkBlacklistedToken, verifyMyTutorProfile);

export default router;