import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

// CORS configuration
app.use(cors({ 
  origin: [
    "http://localhost:3000", 
    "https://learnbridge-dep-01.vercel.app"
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests manually (FIXED)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

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