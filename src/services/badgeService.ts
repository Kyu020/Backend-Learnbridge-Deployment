// services/badgeService.ts
import Badge from "../models/Badge";
import User, { IUser } from "../models/User";
import Session from "../models/Session";
import RequestModel from "../models/Request";
import Review from "../models/Review";
import Upload from "../models/Upload";
import ResourceInteraction from "../models/ResourceInteraction";
import mongoose from "mongoose";

export const checkAndAwardBadges = async (userId: string, triggerType?: string, metadata?: any) => {
  // Accept either a studentId string OR a Mongo _id
  const query: any = mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ studentId: userId }, { _id: userId }] }
    : { studentId: userId };

  const user: IUser | null = await User.findOne(query);
  if (!user) return;

  const badges = await Badge.find();
  const awardedBadges: string[] = [];

  const isStudent = !!user.studentId;
  const isTutor = !!user.isTutor;

  // Safe user ID access - handle both _id and studentId
  const userIdForQueries = user.studentId || (user._id as mongoose.Types.ObjectId).toString();

  for (const badge of badges) {
    const alreadyHas = (user.earnedBadges || []).some(
      (b: any) => b.badgeId.toString() === (badge._id as mongoose.Types.ObjectId).toString()
    );
    if (alreadyHas) continue;

    // Role gating
    if (badge.role === "student" && !isStudent) continue;
    if (badge.role === "tutor" && !isTutor) continue;

    let criteriaMet = false;
    const criteria = badge.criteria;
    if (!criteria) continue;

    switch (criteria.type) {
      case "requestsSent":
        criteriaMet = await checkRequestsSent(userIdForQueries, criteria.threshold);
        break;

      case "requestsAccepted":
        criteriaMet = await checkRequestsAccepted(userIdForQueries, criteria.threshold);
        break;

      case "sessionsCompleted":
        criteriaMet = await checkSessionsCompleted(userIdForQueries, criteria.threshold);
        break;

      case "sessionsHosted":
        criteriaMet = await checkSessionsHosted(userIdForQueries, criteria.threshold);
        break;

      case "firstSession":
        criteriaMet = await checkFirstSession(userIdForQueries);
        break;

      case "fiveStarReviews":
        criteriaMet = await checkFiveStarReviews(userIdForQueries, criteria.threshold, isTutor);
        break;

      case "consecutiveSessions":
        criteriaMet = await checkConsecutiveSessions(userIdForQueries, criteria.threshold);
        break;

      case "quickLearner":
        if (!criteria.timeframe) { criteriaMet = false; break; }
        criteriaMet = await checkQuickLearner(userIdForQueries, criteria.timeframe, criteria.threshold);
        break;

      case "helpfulTutor":
        criteriaMet = await checkHelpfulTutor(userIdForQueries, criteria.threshold);
        break;

      case "earlyAdopter":
        criteriaMet = await checkEarlyAdopter(user);
        break;

      case "perfectAttendance":
        criteriaMet = await checkPerfectAttendance(userIdForQueries, criteria.threshold);
        break;

      case "totalDuration":
        criteriaMet = await checkTotalDuration(userIdForQueries, criteria.threshold, isTutor);
        break;

      case "resourcesViewed":
        criteriaMet = await checkResourcesViewed(userIdForQueries, criteria.threshold);
        break;

      case "consistentLearner":
        criteriaMet = await checkConsistentLearner(userIdForQueries, criteria.threshold, criteria.timeframe || undefined);
        break;

      case "communityContributor":
        criteriaMet = await checkCommunityContributor(user, criteria.threshold);
        break;

      case "sessionStreak":
        criteriaMet = await checkSessionStreak(userIdForQueries, criteria.threshold);
        break;
    }

    if (criteriaMet) {
      user.earnedBadges.push({
        badgeId: badge._id as mongoose.Types.ObjectId,
        earnedAt: new Date()
      });
      awardedBadges.push(badge.name);
      await user.save();

      await sendBadgeNotification(userIdForQueries, badge.name);
    }
  }

  return awardedBadges;
};

// Helpers
const checkRequestsSent = async (userId: string, threshold: number): Promise<boolean> => {
  const count = await RequestModel.countDocuments({ studentId: userId });
  return count >= threshold;
};

const checkRequestsAccepted = async (userId: string, threshold: number): Promise<boolean> => {
  const count = await RequestModel.countDocuments({
    studentId: userId,
    status: "accepted",
  });
  return count >= threshold;
};

const checkSessionsCompleted = async (userId: string, threshold: number): Promise<boolean> => {
  const count = await Session.countDocuments({
    studentId: userId,
    status: "completed",
  });
  return count >= threshold;
};

const checkSessionsHosted = async (userId: string, threshold: number): Promise<boolean> => {
  const count = await Session.countDocuments({
    tutorId: userId,
    status: "completed",
  });
  return count >= threshold;
};

const checkFirstSession = async (userId: string): Promise<boolean> => {
  const count = await Session.countDocuments({
    $or: [
      { studentId: userId, status: "completed" },
      { tutorId: userId, status: "completed" },
    ]
  });
  return count >= 1;
};

const checkFiveStarReviews = async (userId: string, threshold: number, isTutor: boolean): Promise<boolean> => {
  if (isTutor) {
    const count = await Review.countDocuments({
      tutorId: userId,
      rating: 5
    });
    return count >= threshold;
  } else {
    const count = await Review.countDocuments({
      studentId: userId,
      rating: 5
    });
    return count >= threshold;
  }
};

const checkConsecutiveSessions = async (userId: string, threshold: number): Promise<boolean> => {
  const sessions = await Session.find({
    $or: [{ studentId: userId }, { tutorId: userId }],
    status: "completed"
  }).sort({ sessionDate: -1 }).limit(threshold);

  if (sessions.length < threshold) return false;

  for (let i = 1; i < sessions.length; i++) {
    const prevSession = sessions[i - 1];
    const currentSession = sessions[i];

    // Add null checks for session objects
    if (!prevSession || !currentSession) return false;

    const prevDate = prevSession.sessionDate || prevSession.createdAt;
    const currentDate = currentSession.sessionDate || currentSession.createdAt;
    if (!prevDate || !currentDate) return false;

    const daysDiff = Math.abs(Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysDiff > 2) return false;
  }

  return true;
};

const checkQuickLearner = async (userId: string, timeframe: number, threshold: number): Promise<boolean> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  const count = await Session.countDocuments({
    studentId: userId,
    status: "completed",
    sessionDate: { $gte: startDate }
  });

  return count >= threshold;
};

const checkHelpfulTutor = async (userId: string, threshold: number): Promise<boolean> => {
  const count = await Review.countDocuments({
    tutorId: userId,
    rating: { $gte: 4 },
    comment: { $regex: /helpful|great|awesome|excellent|amazing|very helpful/i }
  });

  return count >= threshold;
};

const checkEarlyAdopter = async (user: IUser): Promise<boolean> => {
  const platformLaunchDate = new Date("2025-11-01");
  const daysSinceUserJoined = Math.floor(
    (Date.now() - (user.createdAt as Date).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceUserJoined <= 30 && (user.createdAt as Date) >= platformLaunchDate;
};

const checkPerfectAttendance = async (userId: string, threshold: number): Promise<boolean> => {
  const sessions = await Session.find({
    $or: [
      { studentId: userId, status: { $in: ["completed", "no-show"] } },
      { tutorId: userId, status: { $in: ["completed", "no-show"] } }
    ]
  }).sort({ sessionDate: -1 }).limit(threshold);

  if (sessions.length < threshold) return false;

  const userSessions = sessions.filter(session => 
    session.studentId === userId || session.tutorId === userId
  );

  const noShows = userSessions.filter(s => s.status === "no-show").length;
  const completedSessions = userSessions.filter(s => s.status === "completed").length;

  return completedSessions >= threshold && noShows === 0;
};

const checkTotalDuration = async (userId: string, threshold: number, isTutor: boolean): Promise<boolean> => {
  const sessions = await Session.find({
    [isTutor ? 'tutorId' : 'studentId']: userId,
    status: "completed"
  });

  const totalDuration = sessions.reduce((total, session) => total + (session.duration || 0), 0);
  return totalDuration >= threshold;
};

const checkResourcesViewed = async (userId: string, threshold: number): Promise<boolean> => {
  // Use ResourceInteraction model to count views
  const count = await ResourceInteraction.countDocuments({ studentId: userId, action: "viewed" });
  return count >= threshold;
};

const checkConsistentLearner = async (userId: string, threshold: number, timeframe?: number): Promise<boolean> => {
  const startDate = new Date();
  if (timeframe) startDate.setDate(startDate.getDate() - timeframe);
  else startDate.setDate(startDate.getDate() - 30);

  const sessions = await Session.find({
    studentId: userId,
    status: "completed",
    sessionDate: { $gte: startDate }
  });

  const uniqueDays = new Set(
    sessions.map(session => {
      const d = session.sessionDate || session.createdAt;
      return d ? new Date(d).toDateString() : null;
    }).filter(Boolean)
  ).size;

  return uniqueDays >= threshold;
};

const checkCommunityContributor = async (user: IUser, threshold: number): Promise<boolean> => {
  if (!user) return false;
  
  const userIdentifier = user.studentId || (user._id as mongoose.Types.ObjectId).toString();
  
  const sessionsHosted = await Session.countDocuments({
    tutorId: userIdentifier,
    status: "completed"
  });

  const resourcesShared = await Upload.countDocuments({
    uploader: user.username
  });

  return (sessionsHosted + resourcesShared) >= threshold;
};
const checkSessionStreak = async (userId: string, threshold: number): Promise<boolean> => {
  const sessions = await Session.find({
    $or: [{ studentId: userId }, { tutorId: userId }],
    status: "completed"
  }).sort({ sessionDate: -1 });

  if (sessions.length < threshold) return false;

  let streak = 1;
  for (let i = 1; i < sessions.length; i++) {
    const prevSession = sessions[i - 1];
    const currentSession = sessions[i];
    
    if (!prevSession || !currentSession) continue;

    const prevDate = prevSession.sessionDate || prevSession.createdAt;
    const currentDate = currentSession.sessionDate || currentSession.createdAt;
    if (!prevDate || !currentDate) continue;

    const dayDiff = Math.floor(Math.abs((prevDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)));
    if (dayDiff === 1) {
      streak++;
      if (streak >= threshold) return true;
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak >= threshold;
};

const sendBadgeNotification = async (userId: string, badgeName: string) => {
  console.log(`🎉 User ${userId} earned badge: ${badgeName}`);
};

// Event triggers
export const triggerBadgeCheck = async (userId: string, eventType: string, metadata?: any) => {
  // Normalize input id (accept _id or studentId)
  const id = userId;
  switch (eventType) {
    case "SESSION_COMPLETED":
    case "SESSION_HOSTED":
    case "REQUEST_SENT":
    case "REQUEST_ACCEPTED":
    case "REVIEW_SUBMITTED":
    case "RESOURCE_VIEWED":
    case "RESOURCE_SHARED":
    case "PROFILE_UPDATED":
    case "USER_REGISTERED":
      await checkAndAwardBadges(id, eventType, metadata);
      break;
    default:
      await checkAndAwardBadges(id);
      break;
  }
};