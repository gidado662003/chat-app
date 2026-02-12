export interface User {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  joinedRooms?: string[];
}

export interface Message {
  _id: string;
  text: string;
  senderId: User;
  chatId: string;
  createdAt: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  readBy: User[];
  isDeleted?: boolean;
  forwardedMessage?: boolean;
  messageToForward?: Message;
   // NEW REPLY FIELDS
  replyTo?: string; // ID of the message being replied to
  replyToSnapshot?: ReplyToSnapshot; 
}

export interface GroupInfo {
  name: string;
  description: string;
  members: User[];
  admins: User[];
}

export interface Chat {
  _id: string;
  name?: string;
  groupName?: string;
  type: "private" | "group";
  participants?: User[];
  members?: User[];
  groupMembers?: User[];
}

export interface ReplyToSnapshot {
  _id: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'file';
  fileName?: string;
  fileUrl?: string;
  senderId: {
    _id: string;
    username: string;
  };
  createdAt: string;
}
