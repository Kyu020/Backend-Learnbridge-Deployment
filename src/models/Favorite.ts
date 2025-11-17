import mongoose from "mongoose"

export interface IFavorite extends mongoose.Document{
    studentId: string;
    tutorId?: string;
    resourceId?: mongoose.Types.ObjectId;
    createdAt?: Date;
}

export const FavoriteSchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true},
        tutorId: { type: String },
        resourceId: { type:mongoose.Schema.Types.ObjectId, ref: "Upload" }
    },
    { timestamps: true, versionKey: false }
)

export default mongoose.model<IFavorite>("Favorite", FavoriteSchema)