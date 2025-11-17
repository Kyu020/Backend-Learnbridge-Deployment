import { Request, Response } from "express";
import Tutor from "../models/Tutor";
import User from "../models/User";
import Review from "../models/Review";

export const createTutorProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const studentId = user.studentId;
        const name = user.username;

        const { bio, course, hourlyRate, availability, credentials, teachingLevel, teachingStyle, modeOfTeaching } = req.body;

        const existingProfile = await Tutor.findOne({ studentId });
        if (existingProfile) {
            return res.status(400).json({ message: "You've already created a tutor profile" });
        }
        // Find user and enable tutor mode
        const tutorStatus = await User.findOne({ studentId });
        if (!tutorStatus) {
            return res.status(404).json({ message: "User not found" });
        }

        // Enable tutor mode if not already enabled
        if (tutorStatus.isTutor !== true) {
            tutorStatus.isTutor = true;
            await tutorStatus.save();
        }

        const tutor = new Tutor({
            studentId,
            name,
            bio,
            course,
            hourlyRate,
            availability,
            credentials,
            teachingLevel,
            teachingStyle,
            modeOfTeaching,
        });

        await tutor.save();

        return res.status(200).json({
            message: "Tutor profile created successfully",
            tutor,
        });

    } catch (err) {
        console.error("❌ Create Tutor Profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTutorProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const studentId = user.studentId;

        const { bio, course, hourlyRate, availability, credentials, teachingLevel, teachingStyle, modeOfTeaching } = req.body;

        // Check if tutor profile exists
        const tutor = await Tutor.findOne({ studentId });
        if (!tutor) {
            return res.status(404).json({ message: "Tutor profile not found" });
        }

        // Update only fields that exist in the request body
        if (bio !== undefined) tutor.bio = bio;
        if (course !== undefined) tutor.course = course;
        if (hourlyRate !== undefined) tutor.hourlyRate = hourlyRate;
        if (availability !== undefined) tutor.availability = availability;
        if (credentials !== undefined) tutor.credentials = credentials;
        if (teachingLevel !== undefined) tutor.teachingLevel = teachingLevel;
        if (teachingStyle !== undefined) tutor.teachingStyle = teachingStyle;
        if (modeOfTeaching !== undefined) tutor.modeOfTeaching = modeOfTeaching;

        await tutor.save();

        return res.status(200).json({
            message: "Tutor profile updated successfully",
            updatedProfile: tutor,
        });

    } catch (err) {
        console.error("❌ Update Tutor Profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const toggleTutorMode = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;

        // Check if user exists
        const userRecord = await User.findOne({ studentId });
        if (!userRecord) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user has a tutor profile before allowing toggle
        const tutorProfile = await Tutor.findOne({ studentId });
        if (!tutorProfile) {
            return res.status(400).json({ 
                message: "Please create a tutor profile first before enabling tutor mode" 
            });
        }

        // Toggle the isTutor status
        userRecord.isTutor = !userRecord.isTutor;
        await userRecord.save();

        return res.status(200).json({
            message: `Tutor mode ${userRecord.isTutor ? "enabled" : "disabled"}`,
            isTutor: userRecord.isTutor,
        });

    } catch (err) {
        console.error("❌ Toggle Tutor Mode error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllTutorProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const currentStudentId = user.studentId;

        // Fetch all active tutors and select studentId only
        const activeTutors = await User.find({ isTutor: true }).select("studentId profilePicture username email program");

        // Filter out any users with missing studentId
        const activeTutorIds = activeTutors
            .map(u => u.studentId)
            .filter(id => id !== undefined && id !== null);

        // Ensure the array is not empty before querying Tutor
        if (!activeTutorIds.length) {
            return res.status(200).json({ message: "No active tutors found at the moment" });
        }

        // Fetch tutors whose studentId is in activeTutorIds but not the current user
        const tutors = await Tutor.find({
            studentId: { $in: activeTutorIds, $ne: currentStudentId }
        }).sort({ createdAt: -1 });

        if (!tutors.length) {
            return res.status(200).json({ message: "No active tutors found at the moment" });
        }

        // Combine tutor data with user data
        const tutorsWithUserData = tutors.map(tutor => {
            const userData = activeTutors.find(user => user.studentId === tutor.studentId);
            return {
                ...tutor.toObject(),
                // User data
                username: userData?.username,
                email: userData?.email,
                program: userData?.program,
                profilePicture: userData?.profilePicture,
                // Keep tutor data
                bio: tutor.bio,
                course: tutor.course,
                hourlyRate: tutor.hourlyRate,
                availability: tutor.availability,
                teachingLevel: tutor.teachingLevel,
                teachingStyle: tutor.teachingStyle,
                modeOfTeaching: tutor.modeOfTeaching,
                credentials: tutor.credentials,
                ratingAverage: tutor.ratingAverage,
                ratingCount: tutor.ratingCount,
                favoriteCount: tutor.favoriteCount
            };
        });

        return res.status(200).json({
            message: "Active tutors fetched successfully",
            tutors: tutorsWithUserData,
        });

    } catch (err: any) {
        console.error("❌ Get Tutor Profiles error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const getTutorProfile = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // Find tutor and user data in parallel
        const [tutor, user] = await Promise.all([
            Tutor.findOne({ studentId }),
            User.findOne({ studentId }).select("username email program profilePicture learningLevel preferredMode")
        ]);

        if (!tutor || !user) {
            return res.status(404).json({ message: "Tutor not found" });
        }

        // Calculate real-time rating stats from reviews
        const ratingStats = await Review.aggregate([
            { $match: { tutorId: studentId } },
            {
                $group: {
                    _id: "$tutorId",
                    avgRating: { $avg: "$rating" },
                    countRating: { $sum: 1 }
                }
            }
        ]);

        const currentStats = ratingStats[0];
        
        // Update tutor document with latest ratings (optional - for performance)
        if (currentStats) {
            await Tutor.updateOne(
                { studentId },
                {
                    ratingAverage: currentStats.avgRating,
                    ratingCount: currentStats.countRating
                }
            );
        }

        // Combine tutor and user data
        const tutorWithCompleteData = {
            // Tutor data
            ...tutor.toObject(),
            // User data
            username: user.username,
            email: user.email,
            program: user.program,
            profilePicture: user.profilePicture,
            learningLevel: user.learningLevel,
            preferredMode: user.preferredMode,
            // Latest ratings
            ratingAverage: currentStats?.avgRating || tutor.ratingAverage,
            ratingCount: currentStats?.countRating || tutor.ratingCount
        };

        return res.status(200).json({
            message: "Tutor profile fetched successfully",
            data: tutorWithCompleteData,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const verifyMyTutorProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const studentId = user.studentId;

        // Fetch both tutor profile and user data
        const [tutorProfile, userData] = await Promise.all([
            Tutor.findOne({ studentId }),
            User.findOne({ studentId }).select("username email program profilePicture isTutor")
        ]);

        if (!tutorProfile) {
            return res.status(200).json({ message: "No tutor profile found for this user" });
        }

        // Combine data
        const completeTutorProfile = {
            ...tutorProfile.toObject(),
            username: userData?.username,
            email: userData?.email,
            program: userData?.program,
            profilePicture: userData?.profilePicture,
            isTutor: userData?.isTutor
        };

        return res.status(200).json({
            message: "You have a tutor profile",
            tutorProfile: completeTutorProfile,
        });

    } catch (err) {
        console.error("❌ Verify My Tutor Profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
