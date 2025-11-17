import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
  name: string;
  program: string; // e.g., "BSIT", "BSCS"
  createdAt?: Date;
}

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  program: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model<ICourse>("Course", CourseSchema);
