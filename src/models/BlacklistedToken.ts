import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export default mongoose.model<IBlacklistedToken>("BlacklistedToken", BlacklistedTokenSchema);
