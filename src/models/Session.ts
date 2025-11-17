import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  studentId: string;
  tutorId: string;
  course: string;
  sessionDate: Date;
  duration: number;
  price: number;
  status: "pending" | "accepted" | "scheduled" | "completed" | "cancelled" | "rejected" | "no-show";
  modality: "online" | "in-person";

  meetingId?: string;
  roomId?: string;
  meetingUrl?: string;

  studentSeen: boolean;
  tutorSeen: boolean;
  createdAt?: Date;
}

const SessionSchema: Schema = new Schema({
  studentId: { type: String, ref: "User", required: true },
  tutorId: { type: String, ref: "Tutor", required: true },
  course: { type: String, required: true },
  sessionDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "scheduled", "completed", "cancelled", "rejected", "no-show"],
    default: "pending"
  },
  meetingId: { type: String },
  roomId: { type: String },
  meetingUrl: { type: String },
  studentSeen: { type: Boolean, default: false },
  tutorSeen: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

export default mongoose.model<ISession>("Session", SessionSchema);
