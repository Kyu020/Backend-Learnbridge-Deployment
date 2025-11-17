import { Request, Response } from "express";
import RequestModel from "../models/Request";
import User from "../models/User";
import Session from "../models/Session";
import { triggerBadgeCheck } from "../services/badgeService";
import { MeetingService } from "../services/meetingService";

export const sendRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    const { tutorId, sessionDate, duration, price, course, comment, modality } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!tutorId) {
      return res.status(400).json({ message: "Tutor unavailable or not registered" });
    }

    if (!sessionDate || !duration || !price || !modality) {
      return res.status(400).json({ message: "Missing required session details" });
    }

    // Prevent duplicate pending requests
    const existingPending = await RequestModel.findOne({
      studentId,
      tutorId,
      status: "pending"
    });

    if (existingPending) {
      return res.status(400).json({
        message: "You already have a pending request with this tutor"
      });
    }

    // Create the request
    const newRequest = new RequestModel({
      tutorId,
      studentId,
      sessionDate,
      duration,
      price,
      course,
      comment,
      modality, // Add modality
      status: "pending",
    });

    await newRequest.save();

    await Session.create({
      tutorId,
      studentId,
      course,
      sessionDate,
      duration,
      price,
      modality, // Add modality
      status: "pending",
      tutorSeen: false,
      studentSeen: true,
    });

    const studentInfo = await User.findOne(
      { studentId },
      "username email program specialization"
    );

    await triggerBadgeCheck(studentId, "REQUEST_SENT");

    return res.status(201).json({
      message: "Request sent successfully",
      body: { ...newRequest.toObject(), studentInfo }
    });

  } catch (err: any) {
    console.error("❌ Send Request error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getTutorRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.studentId)
      return res.status(400).json({ message: "Invalid or missing token" });

    if (!user?.isTutor)
      return res.status(403).json({ message: "Unauthorized: Not a Tutor" });

    const requests = await RequestModel.find({ tutorId: user.studentId }).sort({ createdAt: -1 });

    if (requests.length === 0){
      return res.status(200).json({ message:"No Records Found" })
    }

    const enrichedRequests = await Promise.all(
      requests.map(async (reqItem: any) => {
        const studentInfo = await User.findOne(
          { studentId: reqItem.studentId },
          "username email program profilePicture"
        );
        return { ...reqItem.toObject(), studentInfo };
      })
    );

    res.status(200).json({
      message: "Requests fetched successfully",
      body: enrichedRequests,
    });

  } catch (err) {
    console.error("❌ Get Requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.studentId)
      return res.status(400).json({ message: "Invalid or missing token" });

    const requests = await RequestModel.find({ studentId: user.studentId }).sort({ createdAt: -1 });

    if (requests.length === 0){
      return res.status(200).json({ message:"No Records Found" })
    }

    const enrichedRequests = await Promise.all(
      requests.map(async (reqItem: any) => {
        const tutorInfo = await User.findOne(
          { studentId: reqItem.tutorId },
          "username email program profilePicture"
        );
        return { ...reqItem.toObject(), tutorInfo };
      })
    );

    res.status(200).json({
      message: "Student requests fetched successfully",
      body: enrichedRequests,
    });

  } catch (err) {
    console.error("❌ Get Student Requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status, tutorComment, comment } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    // Find the request first to check ownership
    const request = await RequestModel.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is authorized to update this request
    const isTutor = request.tutorId.toString() === user.studentId;
    const isStudent = request.studentId.toString() === user.studentId;

    if (!isTutor && !isStudent) {
      return res.status(403).json({ message: "Unauthorized: You can only update your own requests" });
    }

    const updateData: any = {};
    
    // STUDENT UPDATES: Can update comment or cancel booking
    if (isStudent) {
      if (comment !== undefined) {
        // Student updating their comment
        updateData.comment = comment;
        updateData.studentSeen = true;
        updateData.tutorSeen = false;
      } else if (status === "cancelled") {
        // Student cancelling their booking
        if (request.status !== "pending" && request.status !== "accepted") {
          return res.status(400).json({ 
            message: "Cannot cancel booking. Only pending or accepted bookings can be cancelled." 
          });
        }
        updateData.status = status;
        updateData.studentSeen = true;
        updateData.tutorSeen = false;
      } else if (status && status !== "cancelled") {
        // Student trying to update status to something other than cancelled
        return res.status(403).json({ 
          message: "Students can only cancel bookings or update comments, not change status." 
        });
      }
    }

    // TUTOR UPDATES: Can update status and tutorComment
    if (isTutor) {
      if (status) {
        // Tutor updating status
        updateData.status = status;
        updateData.tutorSeen = true;
        updateData.studentSeen = false;
        
        if (tutorComment !== undefined) {
          updateData.tutorComment = tutorComment;
        }
      } else if (tutorComment !== undefined) {
        // Tutor just updating comment without status change
        updateData.tutorComment = tutorComment;
        updateData.tutorSeen = true;
        updateData.studentSeen = false;
      }
    }

    // If no valid updates, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: "No valid updates provided. Students can update comments or cancel. Tutors can update status and comments." 
      });
    }

    // Apply the updates
    const updatedRequest = await RequestModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found after update" });
    }

    // AUTOMATICALLY CREATE MEETING FOR ONLINE SESSIONS WHEN ACCEPTED BY TUTOR
    if (status === "accepted" && updatedRequest.modality === "online" && isTutor) {
      try {
        const { MeetingService } = await import('../services/meetingService');
        const meetingService = new MeetingService();
        
        const meeting = meetingService.createMeeting({
          title: `Tutoring: ${updatedRequest.course}`,
          description: `Tutoring session between ${updatedRequest.studentId} and ${updatedRequest.tutorId}`,
          startTime: new Date(updatedRequest.sessionDate),
          endTime: new Date(new Date(updatedRequest.sessionDate).getTime() + updatedRequest.duration * 60000),
          participants: [updatedRequest.studentId, updatedRequest.tutorId],
        }, user.studentId);

        // Update request with meeting information
        const meetingUpdateData: any = {
          meetingId: meeting.id,
          roomId: meeting.roomId,
          meetingUrl: `/meeting/${meeting.roomId}`
        };

        await RequestModel.findOneAndUpdate(
          { _id: updatedRequest._id },
          { $set: meetingUpdateData }
        );

        // Update the response object
        updatedRequest.meetingId = meeting.id;
        updatedRequest.roomId = meeting.roomId;
        updatedRequest.meetingUrl = `/meeting/${meeting.roomId}`;

        console.log(`✅ Meeting created for booking ${updatedRequest._id}: ${meeting.roomId}`);
      } catch (meetingError) {
        console.error("❌ Meeting creation error:", meetingError);
      }
    }

    // Handle session creation/updating (only for status changes, not comment updates)
    if (status && (status === "accepted" || status === "completed" || status === "cancelled")) {
      let session = await Session.findOne({
        tutorId: updatedRequest.tutorId,
        studentId: updatedRequest.studentId,
        sessionDate: updatedRequest.sessionDate,
      });

      if (!session) {
        const sessionData: any = {
          tutorId: updatedRequest.tutorId,
          studentId: updatedRequest.studentId,
          course: updatedRequest.course,
          sessionDate: updatedRequest.sessionDate,
          duration: updatedRequest.duration,
          price: updatedRequest.price,
          modality: updatedRequest.modality,
          status: status,
        };

        // Add meeting info if available
        if (updatedRequest.meetingId) {
          sessionData.meetingId = updatedRequest.meetingId;
          sessionData.roomId = updatedRequest.roomId;
          sessionData.meetingUrl = updatedRequest.meetingUrl;
        }

        session = await Session.create(sessionData);
      } else {
        const sessionUpdateData: any = {
          status: status
        };

        // Update meeting info if it was created
        if (updatedRequest.meetingId) {
          sessionUpdateData.meetingId = updatedRequest.meetingId;
          sessionUpdateData.roomId = updatedRequest.roomId;
          sessionUpdateData.meetingUrl = updatedRequest.meetingUrl;
        }

        await Session.findOneAndUpdate(
          { _id: session._id },
          { $set: sessionUpdateData }
        );
      }

      // Trigger badge checks for status changes
      if (status === "accepted") {
        await triggerBadgeCheck(updatedRequest.studentId, "REQUEST_ACCEPTED");
      }

      if (status === "completed") {
        await triggerBadgeCheck(updatedRequest.studentId, "SESSION_COMPLETED");
        await triggerBadgeCheck(updatedRequest.tutorId, "SESSION_HOSTED");
      }
    }

    return res.status(200).json({
      message: "Request updated successfully",
      body: updatedRequest,
    });

  } catch (err: any) {
    console.error("❌ Update Request error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
