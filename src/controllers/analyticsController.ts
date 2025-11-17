// src/controllers/analyticsController.ts
import { Request, Response } from "express";
import Session from "../models/Session";
import ResourceInteraction from "../models/ResourceInteraction";

export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    // 1️⃣ Completed sessions as student
    const completedSessions = await Session.find({ studentId, status: "completed" });

    const sessionsByCourse: Record<string, number> = {};
    const studentDurationByCourse: Record<string, number> = {};

    completedSessions.forEach((s) => {
      sessionsByCourse[s.course] = (sessionsByCourse[s.course] || 0) + 1;
      studentDurationByCourse[s.course] =
        (studentDurationByCourse[s.course] || 0) + s.duration;
    });

    // 2️⃣ Completed sessions as tutor
    const tutorSessions = await Session.find({ tutorId: studentId, status: "completed" });

    const totalTutoredSessions = tutorSessions.length;

    const tutorDurationByCourse: Record<string, number> = {};
    tutorSessions.forEach((s) => {
      tutorDurationByCourse[s.course] =
        (tutorDurationByCourse[s.course] || 0) + s.duration;
    });

    // 🔥 NEW: total tutor duration across all courses
    const totalTutoredDuration = tutorSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );

    // 3️⃣ Resources viewed
    const resourceViews = await ResourceInteraction.find({ studentId });
    const resourcesViewedByCourse: Record<string, number> = {};
    resourceViews.forEach((r) => {
      resourcesViewedByCourse[r.course] = (resourcesViewedByCourse[r.course] || 0) + 1;
    });

    // 4️⃣ Session history (only completed sessions)
    const sessionHistory = await Session.find({ 
      studentId,
      status: "completed" // Only show completed sessions in history
    })
      .sort({ sessionDate: -1 })
      .limit(10);

    // 5️⃣ Recent activity
    // Get recent sessions (all statuses but limit to recent ones)
    const recentSessions = await Session.find({
      $or: [{ studentId }, { tutorId: studentId }]
    })
      .sort({ createdAt: -1 })
      .limit(15); // Get more sessions to filter

    // Fetch recent resource interactions
    const recentResources = await ResourceInteraction.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Combine and sort all activities by createdAt - FIXED LOGIC
    const recentActivities = [
      ...recentSessions.map((s) => ({
        type: "session" as const,
        course: s.course,
        date: s.createdAt || new Date(),
        duration: s.duration,
        status: s.status, // Include status to filter in frontend if needed
        role: s.studentId === studentId ? "student" : "tutor",
        sessionDate: s.sessionDate,
        _id: s._id 
      })),
      ...recentResources.map((r) => ({
        type: "resource" as const,
        title: r.title,
        course: r.course,
        resourceId: r.resourceId,
        action: r.action,
        date: r.createdAt || new Date(),
        _id: r._id
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Only return top 10 most recent

    // 6️⃣ Separate pending sessions count for dashboard
    const pendingSessions = await Session.find({
      $or: [{ studentId }, { tutorId: studentId }],
      status: "pending"
    }).countDocuments();

    res.json({
      sessionsByCourse,
      studentDurationByCourse,
      tutorDurationByCourse,
      resourcesViewedByCourse,
      sessionHistory,
      recentActivities,
      totalTutoredSessions,
      totalTutoredDuration,
      pendingSessionsCount: pendingSessions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};