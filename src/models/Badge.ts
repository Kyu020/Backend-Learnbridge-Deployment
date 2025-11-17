import mongoose, { Document, Schema } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  role: "student" | "tutor" | "both";
  rarity: "common" | "rare" | "epic" | "legendary";
  criteria: {
    type: 
      | "sessionsCompleted"
      | "sessionsHosted"
      | "requestsSent"
      | "requestsAccepted"
      | "fiveStarReviews"
      | "firstSession"
      | "consecutiveSessions"
      | "quickLearner"
      | "helpfulTutor"
      | "earlyAdopter"
      | "perfectAttendance"
      | "totalDuration"
      | "resourcesViewed"
      | "consistentLearner"
      | "communityContributor"
      | "sessionStreak";
    threshold: number;
    timeframe?: number;
    consecutive?: boolean;
  };
  rewards: {
    points: number;
    perks: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const BadgeSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String 
  },
  icon: { 
    type: String 
  },
  role: { 
    type: String, 
    enum: ["student", "tutor", "both"], 
    default: "both" 
  },
  rarity: { 
    type: String, 
    enum: ["common", "rare", "epic", "legendary"], 
    default: "common" 
  },
  criteria: {
    type: {
      type: String,
      enum: [
        "sessionsCompleted",
        "sessionsHosted",
        "requestsSent",
        "requestsAccepted",
        "fiveStarReviews",
        "firstSession",
        "consecutiveSessions",
        "quickLearner",
        "helpfulTutor",
        "earlyAdopter",
        "perfectAttendance",
        "totalDuration",
        "resourcesViewed",
        "consistentLearner",
        "communityContributor",
        "sessionStreak"
      ],
      required: true,
    },
    threshold: { 
      type: Number, 
      required: true 
    },
    timeframe: { 
      type: Number 
    },
    consecutive: { 
      type: Boolean, 
      default: false 
    }
  },
  rewards: {
    points: { 
      type: Number, 
      default: 0 
    },
    perks: [{ 
      type: String 
    }]
  }
}, { 
  timestamps: true 
});

export default mongoose.model<IBadge>("Badge", BadgeSchema);