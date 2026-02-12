export interface MeetingPreview {
  _id: string;
  title: string;
  date: string;
  department: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export interface MeetingPreviewResponse {
  meetings: MeetingPreview[];
  nextCursor: string | null;
}

export type ActionItemStatus = "pending" | "completed";

export interface ActionItem {
  _id: string;
  meetingId: string;
  desc: string;
  owner: string;
  due: string; // ISO date string
  status: ActionItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export interface Meeting {
  _id: string;
  title: string;
  department: string;
  date: string; // ISO date string
  attendees: string[];
  agenda?: string;
  minutes?: string;
  actionItems: ActionItem[]; // when NOT populated
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}
