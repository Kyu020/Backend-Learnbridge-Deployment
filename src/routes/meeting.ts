import { Router } from 'express';
import { MeetingService } from '../services/meetingService';
import { verifyToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const meetingService = new MeetingService();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

router.post('/meetings', (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, startTime, endTime, participants } = req.body;
    
    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, startTime, and endTime are required' 
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const createdBy = req.user.userId;

    const meeting = meetingService.createMeeting(
      {
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        participants: participants || [],
      },
      createdBy
    );

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

router.get('/meetings/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    const meeting = meetingService.getMeeting(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Optional: Check if user has access to this meeting
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;
    if (meeting.createdBy !== userId && !meeting.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied to this meeting' });
    }

    res.json({
      message: 'Meeting retrieved successfully',
      meeting
    });
  } catch (error) {
    console.error('Error getting meeting:', error);
    res.status(500).json({ error: 'Failed to get meeting' });
  }
});

router.get('/meetings', (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;
    const meetings = meetingService.getUserMeetings(userId);
    
    res.json({
      message: 'Meetings retrieved successfully',
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error('Error getting user meetings:', error);
    res.status(500).json({ error: 'Failed to get meetings' });
  }
});

export default router;