import { Router } from "express";
import { sendRequest, getTutorRequests, getStudentRequests, updateRequestStatus } from "../controllers/requestController";
import { verifyToken, checkBlacklistedToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/sendrequest", verifyToken, checkBlacklistedToken, sendRequest);
router.get("/getrequests", verifyToken, checkBlacklistedToken, getTutorRequests);
router.get("/getstudentrequests", verifyToken, checkBlacklistedToken, getStudentRequests);
router.put("/updaterequeststatus/:id", verifyToken, checkBlacklistedToken, updateRequestStatus);

export default router;
