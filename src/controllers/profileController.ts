import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { triggerBadgeCheck } from "../services/badgeService";
import Tutor from "../models/Tutor";
import cloudinary from "../config/cloudinary";

// Get logged-in user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await User.findById(user.userId)
      .select("-password")
      .populate("earnedBadges.badgeId");
      
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: dbUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedFields = [
      "username",
      "learningInterests",
      "learningLevel",
      "preferredLearningStyle",
      "preferredMode",
      "budgetRange",
      "availability",
    ];

    const updates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Handle photo upload with proper TypeScript checks
    if (req.file) {
      try {
        // Upload to Cloudinary - using upload_stream with proper typing
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "user-profiles",
              transformation: [
                { width: 500, height: 500, crop: "limit" },
                { quality: "auto" },
                { format: "webp" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          // End the stream with the file buffer - add null check
          if (req.file && req.file.buffer) {
            uploadStream.end(req.file.buffer);
          } else {
            reject(new Error("File buffer is undefined"));
          }
        });

        updates.profilePicture = {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes
        };

      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload photo" });
      }
    }

    // Get current user to check existing photo
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old photo from Cloudinary if new one is uploaded
    if (req.file && currentUser.profilePicture?.public_id) {
      try {
        await cloudinary.uploader.destroy(currentUser.profilePicture.public_id);
      } catch (deleteError) {
        console.error("Error deleting old photo:", deleteError);
        // Continue with update even if deletion fails
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a tutor profile and update both name and photo
    let updatedTutor = null;
    const tutorUpdates: Record<string, any> = {};

    if (updates.username !== undefined) {
      tutorUpdates.name = updates.username;
    }

    if (updates.profilePicture !== undefined) {
      tutorUpdates.profilePicture = updates.profilePicture;
    }

    if (Object.keys(tutorUpdates).length > 0) {
      updatedTutor = await Tutor.findOneAndUpdate(
        { studentId: user.studentId },
        { $set: tutorUpdates },
        { new: true }
      );
    }

    await triggerBadgeCheck(user.studentId, "PROFILE_UPDATED");

    const response: any = {
      message: "Profile updated successfully",
      user: updatedUser,
    };

    // Include tutor data in response if it was updated
    if (updatedTutor) {
      response.tutor = updatedTutor;
    }

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user password
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    dbUser.password = await bcrypt.hash(newPassword, 10);
    await dbUser.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Cloudinary if exists
    if (dbUser.profilePicture?.public_id) {
      try {
        await cloudinary.uploader.destroy(dbUser.profilePicture.public_id);
      } catch (deleteError) {
        console.error("Error deleting photo from Cloudinary:", deleteError);
      }
    }

    // Remove photo from user profile
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $unset: { profilePicture: 1 } },
      { new: true }
    ).select("-password");

    // Remove photo from tutor profile if exists
    await Tutor.findOneAndUpdate(
      { studentId: user.studentId },
      { $unset: { profilePicture: 1 } }
    );

    res.json({ 
      message: "Profile photo deleted successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};