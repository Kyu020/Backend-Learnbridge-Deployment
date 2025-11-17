import { v4 as uuidv4 } from 'uuid';
import { Meeting, CreateMeetingData } from '../interfaces/Meeting';

export class MeetingService {
  private meetings: Map<string, Meeting> = new Map();

  createMeeting(data: CreateMeetingData, createdBy: string): Meeting {
    const meeting: Meeting = {
      id: uuidv4(),
      roomId: this.generateRoomId(),
      ...data,
      createdBy,
    };

    this.meetings.set(meeting.id, meeting);
    return meeting;
  }

  getMeeting(id: string): Meeting | undefined {
    return this.meetings.get(id);
  }

  getUserMeetings(userId: string): Meeting[] {
    return Array.from(this.meetings.values()).filter(
      meeting => meeting.createdBy === userId || meeting.participants.includes(userId)
    );
  }

  private generateRoomId(): string {
    return `learnbridge-${uuidv4()}`;
  }
}