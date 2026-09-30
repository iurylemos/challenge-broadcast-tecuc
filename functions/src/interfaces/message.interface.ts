import { Timestamp } from "firebase-admin/firestore";

export enum MessageStatus {
  SCHEDULED = "scheduled",
  SENT = "sent",
}

export interface Message {
  ownerId: string;
  connectionId: string;
  contactIds: string[];
  message: string;
  status: MessageStatus;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MessageData = {
  id: string;
  status: string;
};

export type MessageCreated = {
  success: boolean;
};
