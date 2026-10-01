import { Timestamp } from "firebase-admin/firestore";

export type Connection = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
