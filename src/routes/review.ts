import { Router } from "express"
import { addOrUpdateReview, getTutorReviews, deleteReview } from "../controllers/reviewController"
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware"

const router = Router();

router.post("/review", verifyToken, checkBlacklistedToken, addOrUpdateReview);
router.get("/getreviews/:tutorId", verifyToken, checkBlacklistedToken, getTutorReviews);
router.delete("/deletereview/:tutorId", verifyToken, checkBlacklistedToken, deleteReview)

export default router;