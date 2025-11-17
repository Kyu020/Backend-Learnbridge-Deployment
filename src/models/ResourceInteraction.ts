import mongoose, { Document, Schema } from "mongoose";

export interface IResourceInteraction extends Document {
  studentId: string;
  resourceId: mongoose.Types.ObjectId;
  title: string
  course: string;
  action: "uploaded" | "viewed" | "downloaded";
  createdAt?: Date;
}

const ResourceInteractionSchema: Schema = new Schema({
  studentId: { type: String, ref: "User", required: true },
  resourceId: { type: Schema.Types.ObjectId, ref: "Upload", required: true },
  title: { type: String, ref:"Upload", required: true },
  course: { type: String, required: true },
  action: { type: String, enum: ["uploaded", "viewed", "downloaded"], required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model<IResourceInteraction>("ResourceInteraction", ResourceInteractionSchema);
