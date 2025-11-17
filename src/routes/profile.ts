import { Router } from "express"
import { getProfile, updatePassword, updateProfile } from "../controllers/profileController"
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";
import { uploadSingle } from "../middleware/upload"

const router = Router();

router.get("/getprofile", verifyToken, checkBlacklistedToken, getProfile)
router.put("/updatepassword", verifyToken, checkBlacklistedToken, updatePassword)
router.put("/updateprofile", verifyToken, checkBlacklistedToken, uploadSingle ,updateProfile)

export default router;