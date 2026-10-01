import { Timestamp } from "firebase-admin/firestore";

export type Contact = {
  id: string;
  ownerId: string;
  connectionId: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
