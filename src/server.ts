import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Badge from "./models/Badge";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import tutorRoutes from "./routes/tutor";
import requestRoutes from "./routes/request";
import favoriteRoutes from "./routes/favorite";
import reviewRoutes from "./routes/review";
import matchingRoutes from "./routes/matching";
import profileRoutes from "./routes/profile";
import analyticsRoutes from "./routes/analytics";
import meetingRoutes from "./routes/meeting";
import { initializeDefaultBadges } from "./scripts/initializeBadge";
import { connectDB } from "./database";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/meetings", meetingRoutes);

const port = process.env.PORT || 5000;

async function startServer() {
    try{
      await connectDB();

      await initializeDefaultBadges();

      app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
      });
  } catch (err){
      console.error("❌ Failed to start server:", err);
  }
} 

startServer();

