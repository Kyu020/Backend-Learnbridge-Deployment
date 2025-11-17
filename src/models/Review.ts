import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  tutorId: string;
  studentId: string;
  rating: number;
  comment: string;
}

const ReviewSchema: Schema = new Schema(
  {
    tutorId: { type: String, ref: "Tutor", required: true },
    studentId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<IReview>("Review", ReviewSchema);
