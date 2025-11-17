export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  createdBy: string;
  roomId: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
}