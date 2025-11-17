import Badge from "../models/Badge";

export const initializeDefaultBadges = async () => {
  const defaultBadges = [
    {
      name: "First Session",
      description: "Complete your first tutoring session",
      icon: "🎯",
      role: "both",
      rarity: "common",
      criteria: {
        type: "firstSession",
        threshold: 1
      },
      rewards: { points: 100 }
    },
    {
      name: "Dedicated Learner",
      description: "Complete 10 tutoring sessions",
      icon: "📚",
      role: "student",
      rarity: "common",
      criteria: {
        type: "sessionsCompleted",
        threshold: 10
      },
      rewards: { points: 500 }
    },
    {
      name: "Expert Tutor",
      description: "Host 20 tutoring sessions",
      icon: "👨‍🏫",
      role: "tutor",
      rarity: "rare",
      criteria: {
        type: "sessionsHosted",
        threshold: 20
      },
      rewards: { points: 1000 }
    },
    {
      name: "Quick Learner",
      description: "Complete 5 sessions within 2 weeks",
      icon: "⚡",
      role: "student",
      rarity: "rare",
      criteria: {
        type: "quickLearner",
        threshold: 5,
        timeframe: 14
      },
      rewards: { points: 750 }
    },
    {
      name: "Perfect Attendance",
      description: "Complete 10 sessions without any no-shows",
      icon: "⭐",
      role: "both",
      rarity: "epic",
      criteria: {
        type: "perfectAttendance",
        threshold: 10
      },
      rewards: { points: 2000 }
    },
    {
      name: "Time Master",
      description: "Spend 1000 minutes in tutoring sessions",
      icon: "⏰",
      role: "both",
      rarity: "rare",
      criteria: {
        type: "totalDuration",
        threshold: 1000
      },
      rewards: { points: 1500 }
    },
    {
      name: "Resource Explorer",
      description: "View 50 learning resources",
      icon: "🔍",
      role: "student",
      rarity: "common",
      criteria: {
        type: "resourcesViewed",
        threshold: 50
      },
      rewards: { points: 800 }
    },
    {
      name: "Consistent Learner",
      description: "Learn on 15 different days in a month",
      icon: "📅",
      role: "student",
      rarity: "rare",
      criteria: {
        type: "consistentLearner",
        threshold: 15,
        timeframe: 30
      },
      rewards: { points: 1200 }
    },
    {
      name: "Community Contributor",
      description: "Host 10 sessions and share 5 resources",
      icon: "🤝",
      role: "tutor",
      rarity: "epic",
      criteria: {
        type: "communityContributor",
        threshold: 15
      },
      rewards: { points: 2000 }
    },
    {
      name: "Session Streak",
      description: "Complete sessions for 7 consecutive days",
      icon: "🔥",
      role: "both",
      rarity: "legendary",
      criteria: {
        type: "sessionStreak",
        threshold: 7
      },
      rewards: { points: 3000 }
    },
    {
      name: "Helpful Guide",
      description: "Receive 10 positive reviews as a tutor",
      icon: "💫",
      role: "tutor",
      rarity: "rare",
      criteria: {
        type: "helpfulTutor",
        threshold: 10
      },
      rewards: { points: 1500 }
    }
  ];

  for (const badgeData of defaultBadges) {
    await Badge.findOneAndUpdate(
      { name: badgeData.name },
      badgeData,
      { upsert: true, new: true }
    );
  }
  
  console.log("✅ Analytics-focused badges initialized");
};