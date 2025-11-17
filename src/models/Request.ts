import mongoose, { Document, Schema } from "mongoose";

export interface IRequest extends Document {
  studentId: string;
  tutorId: string;
  course: string;
  sessionDate: Date;
  duration: number;
  price?: number;
  comment: string;
  tutorComment?: string;
  status: "pending" | "accepted" | "scheduled" | "completed" | "cancelled" | "rejected";
  modality: "online" | "in-person";

  meetingId?: string;
  roomId?: string;
  meetingUrl?: string;

  rating?: number;
  review?: string;
  tutorSeen: boolean;
  studentSeen: boolean;
  createdAt?: Date;
}

const RequestSchema: Schema<IRequest> = new Schema(
  {
    studentId: { type: String, ref: "User", required: true },
    tutorId: { type: String, ref: "Tutor", required: true },
    course: { type: String, required: true },
    sessionDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    comment: { type: String, required: true },
    tutorComment: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "scheduled", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    modality: {
      type: String,
      enum: ["online", "in-person"],
      required: true,
    },
    meetingId: { type: String },
    roomId: { type: String },
    meetingUrl: { type: String },

    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    tutorSeen: { type: Boolean, default: false },
    studentSeen: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<IRequest>("Request", RequestSchema);
