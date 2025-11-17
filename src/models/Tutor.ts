import mongoose, { Schema, Document } from "mongoose";


export interface IProfilePicture {
  public_id: string;
  url: string;
  format: string;
  bytes: number;
}

export interface ITutor extends Document {
  studentId: string;
  name: string;
  bio: string;
  course: string[];
  hourlyRate: number;
  availability: string[];

  teachingLevel?: "beginner" | "intermediate" | "advanced";
  teachingStyle?:  "structured" | "interactive" | "conversational"| "project-based" | "problem-solving";
  modeOfTeaching?: "online" | "in-person" | "either";

  profilePicture?: IProfilePicture;

  favoriteCount: number;
  credentials?: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: Date;
}

const TutorSchema: Schema = new Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    bio: { type: String, required: true },
    course: { type: [String], required: true },
    hourlyRate: { type: Number, required: true },
    availability: { type: [String], required: true },

    profilePicture: {
      public_id: { type: String },
      url: { type: String },
      format: { type: String },
      bytes: { type: Number }
    },

    teachingLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },

    teachingStyle: {
      type: String,
      enum: ["structured" , "interactive" , "conversational" , "project-based" , "problem-solving"],
      default: "mixed"
    },

    modeOfTeaching: {
      type: String,
      enum: ["online", "in-person", "either"],
      default: "either"
    },

    favoriteCount: { type: Number, default: 0 },
    credentials: { type: String },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<ITutor>("Tutor", TutorSchema);
