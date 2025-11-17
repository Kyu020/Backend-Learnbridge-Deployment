import { Router } from "express";
import { addFavorite, removeFavorite, getFavorites } from "../controllers/favoriteController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router()

router.post("/addfave", verifyToken, checkBlacklistedToken, addFavorite)
router.post("/removefave", verifyToken, checkBlacklistedToken, removeFavorite)
router.get("/getfave", verifyToken, checkBlacklistedToken, getFavorites)

export default router;