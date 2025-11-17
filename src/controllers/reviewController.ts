import { Request, Response } from "express";
import Review from "../models/Review";
import Tutor from "../models/Tutor";
import RequestModel from "../models/Request";
import User from "../models/User";
import { triggerBadgeCheck } from "../services/badgeService";

export const addOrUpdateReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;
    const { tutorId, rating, comment } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Invalid or missing token" });
    }

    if (studentId === tutorId) {
      return res.status(400).json({ message: "You cannot review yourself." });
    }

    // ✅ Ensure student has a completed session with this tutor
    const completedRequest = await RequestModel.findOne({
      studentId,
      tutorId,
      status: "completed"
    });

    if (!completedRequest) {
      return res.status(403).json({
        message: "You can only review tutors after a completed session."
      });
    }

    // ✅ If review already exists → update instead of creating duplicate
    const existingReview = await Review.findOne({ tutorId, studentId });

    let review;
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      review = await existingReview.save();
    } else {
      review = await Review.create({ tutorId, studentId, rating, comment });
    }

    // ✅ Recalculate tutor rating stats efficiently
    const ratingStats = await Review.aggregate([
      { $match: { tutorId } },
      {
        $group: {
          _id: "$tutorId",
          avgRating: { $avg: "$rating" },
          countRating: { $sum: 1 }
        }
      }
    ]);

    const updatedStats = ratingStats[0];
    await Tutor.updateOne(
      { studentId: tutorId },
      {
        ratingAverage: updatedStats?.avgRating || 0,
        ratingCount: updatedStats?.countRating || 0
      }
    );

    await triggerBadgeCheck(studentId, "REVIEW_SUBMITTED");

    return res.status(existingReview ? 200 : 201).json({
      message: existingReview ? "Review Updated!" : "Review Submitted!",
      review
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;
    const { tutorId } = req.params;

    const deleted = await Review.findOneAndDelete({ tutorId, studentId });

    if (!deleted) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ✅ Recalculate after delete
    const ratingStats = await Review.aggregate([
      { $match: { tutorId } },
      {
        $group: {
          _id: "$tutorId",
          avgRating: { $avg: "$rating" },
          countRating: { $sum: 1 }
        }
      }
    ]);

    const updatedStats = ratingStats[0];
    await Tutor.updateOne(
      { studentId: tutorId },
      {
        ratingAverage: updatedStats?.avgRating || 0,
        ratingCount: updatedStats?.countRating || 0
      }
    );

    res.status(200).json({
      message: "Review deleted successfully",
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTutorReviews = async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;

    const reviews = await Review.find({ tutorId })
      .sort({ createdAt: -1 })
      .lean();

    if (!reviews.length) {
      return res.status(200).json({ message: "No reviews found" });
    }

    // ✅ Attach student info to each review
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const student = await User.findOne(
          { studentId: review.studentId },
          "username program specialization"
        );
        return { ...review, student };
      })
    );

    res.status(200).json(enriched);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
