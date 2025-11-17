import { Router } from "express";
import { register, fetchUser, login, logout } from "../controllers/authController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.get("/me", verifyToken, checkBlacklistedToken, fetchUser);
router.post("/login", login);
router.post("/logout", logout);

export default router;
