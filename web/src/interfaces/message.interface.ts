export enum MessageStatus {
  SCHEDULED = "scheduled",
  SENT = "sent",
}

export interface Message {
  id: string;
  ownerId: string;
  connectionId: string;
  contactIds: string[];
  message: string;
  status: MessageStatus;
  scheduledAt?: string;
  sentAt?: string;
}

export type MessageFilter = "all" | "sent" | "scheduled";
