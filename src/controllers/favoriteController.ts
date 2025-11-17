import { Request, Response } from "express";
import FavoriteModel from "../models/Favorite";
import Tutor from "../models/Tutor";
import Upload from "../models/Upload";

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    const { tutorId, resourceId } = req.body || {};

    if (!tutorId && !resourceId) {
      return res.status(400).json({ message: "You have not chosen to add something into favorites" });
    }

    const query: any = { studentId };
    if (tutorId) query.tutorId = tutorId;
    if (resourceId) query.resourceId = resourceId;

    const existing = await FavoriteModel.findOne(query);
    if (existing) {
      return res.status(400).json({ message: "Already added to favorites" });
    }

    const favorite = new FavoriteModel({
      studentId,
      tutorId: tutorId || undefined,
      resourceId: resourceId || undefined,
    });
    await favorite.save();

    if (tutorId) {
      await Tutor.updateOne(
        { studentId: tutorId },
        { $inc: { favoriteCount: 1 } }
      );
    }
    if (resourceId) {
      await Upload.updateOne(
        { _id: resourceId },
        { $inc: { favoriteCount: 1 } }
      );
    }

    return res.status(201).json({
      message: "Added to Favorites",
      favorite,
    });
  } catch (err: any) {
    console.error("❌ Add Favorite error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;
    const { tutorId, resourceId } = req.body;

    if (!tutorId && !resourceId) {
      return res.status(400).json({ message: "Provide either tutorId or resourceId" });
    }

    const query: any = { studentId };
    if (tutorId) query.tutorId = tutorId;
    if (resourceId) query.resourceId = resourceId;

    const deleted = await FavoriteModel.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // ✅ Decrease Favorite Count (but not below 0)
    if (tutorId) {
      await Tutor.updateOne(
        { studentId: tutorId, favoriteCount: { $gt: 0 } },
        { $inc: { favoriteCount: -1 } }
      );
    }
    if (resourceId) {
      await Upload.updateOne(
        { _id: resourceId, favoriteCount: { $gt: 0 } },
        { $inc: { favoriteCount: -1 } }
      );
    }

    return res.status(200).json({ message: "Removed from favorites" });

  } catch (err: any) {
    console.error("❌ Remove Favorite error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    const favorites = await FavoriteModel.find({ studentId }).sort({ createdAt: -1 });

    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav) => {
        let tutor = null;
        let resource = null;

        if (fav.tutorId) {
          tutor = await Tutor.findOne({ studentId: fav.tutorId })
            .select("studentId name bio subjects hourlyRate favoriteCount profilePicture");
        }

        if (fav.resourceId) {
          resource = await Upload.findById(fav.resourceId)
            .select("title program uploader googleDriveLink createdAt favoriteCount");
        }

        return {
          _id: fav._id,
          studentId: fav.studentId,
          tutorId: fav.tutorId,
          resourceId: fav.resourceId,
          tutor,
          resource,
          createdAt: fav.createdAt,
        };
      })
    );

    return res.status(200).json({
      message: "Favorites fetched successfully",
      favorites: favoritesWithDetails,
    });

  } catch (err: any) {
    console.error("❌ Get Favorites error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
