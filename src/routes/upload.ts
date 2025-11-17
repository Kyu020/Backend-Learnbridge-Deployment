import { Router } from "express";
import multer from "multer";
import { uploadFile, getFile, getAllFile } from "../controllers/uploadController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/uploadfile", verifyToken, upload.single("file"), checkBlacklistedToken, uploadFile);
router.get("/getallfile", verifyToken, checkBlacklistedToken, getAllFile);
router.get("/getfile/:id", verifyToken, checkBlacklistedToken, getFile);

export default router;
    