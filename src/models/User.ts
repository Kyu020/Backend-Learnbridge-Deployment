// models/User.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProfilePicture {
  public_id: string;
  url: string;
  format: string;
  bytes: number;
}

export interface IUser extends Document {
  username: string;
  studentId: string;
  email: string;
  program: string;
  isTutor: boolean;

  profilePicture?: IProfilePicture;

  learningInterests: string[];
  learningLevel: "beginner" | "intermediate" | "advanced";
  preferredLearningStyle: "structured" | "interactive" | "conversational" | "project-based" | "problem-solving";
  preferredMode: "online" | "in-person" | "either";
  budgetRange: {
    min: number;
    max: number;
  };

  earnedBadges: {
    badgeId: Types.ObjectId;
    earnedAt: Date;
  }[];

  availability: string[];
  password: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>({
  username: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  program: { type: String, required: true },

  isTutor: { type: Boolean, default: false },

  profilePicture: {
    public_id: { type: String },
    url: { type: String },
    format: { type: String },
    bytes: { type: Number }
  },

  learningInterests: { type: [String], default: [] },

  learningLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  
  preferredLearningStyle: {
    type: String,
    enum: ["structured", "interactive", "conversational", "project-based", "problem-solving"]
  },

  preferredMode: {
    type: String,
    enum: ["online", "in-person", "either"],
    default: "either"
  },
  
  budgetRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 9999 }
  },
  
  availability: { type: [String], default: [] },
 
  earnedBadges: [
    {
      badgeId: { type: Schema.Types.ObjectId, ref: "Badge" },
      earnedAt: { type: Date, default: Date.now }
    }
  ],

  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const User = mongoose.model<IUser>("User", UserSchema);
export default User;