// controllers/matching.controller.ts
import { Request, Response } from "express";
import User from "../models/User";
import Tutor from "../models/Tutor";

export const matchTutorsForStudent = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // Get the student profile
        const student = await User.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const {
            learningInterests,
            learningLevel,
            preferredLearningStyle,
            preferredMode,
            budgetRange,
            availability
        } = student;

        // Fetch tutors
        const tutors = await Tutor.find();

        // Score tutors
        const scoredTutors = tutors.map((tutor) => {
            let score = 0;

            // 1. Subject Match (40%)
            const courseMatch = tutor.course.some((sub) =>
                learningInterests.includes(sub)
            );
            if (courseMatch) score += 40;

            // 2. Level Match (20%)
            if (tutor.teachingLevel === learningLevel) {
                score += 20;
            }

            // 3. Learning/Teaching Style Match (15%)
            if (tutor.teachingStyle === preferredLearningStyle) {
                score += 15;
            }

            // 4. Mode Match (5%) - smaller weight
            if (tutor.modeOfTeaching === preferredMode || preferredMode === "either") {
                score += 5;
            }

            // 5. Availability Overlap (15%)
            const hasOverlap =
                tutor.availability.some((slot: string) =>
                    availability.includes(slot)
                );
            if (hasOverlap) score += 15;

            // 6. Budget Compatibility (5%)
            if (
                tutor.hourlyRate >= budgetRange.min &&
                tutor.hourlyRate <= budgetRange.max
            ) {
                score += 5;
            }

            return {
                tutor,
                score
            };
        });

        scoredTutors.sort((a, b) => b.score - a.score);

        return res.status(200).json({
            success: true,
            count: scoredTutors.length,
            matches: scoredTutors
        });

    } catch (error: any) {
        console.error("Matching Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to match tutors"
        });
    }
};
