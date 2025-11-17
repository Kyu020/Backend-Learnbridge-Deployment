import { Router } from "express";
import { getUserAnalytics } from "../controllers/analyticsController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/getuseranalytics", verifyToken, checkBlacklistedToken, getUserAnalytics);

export default router;
