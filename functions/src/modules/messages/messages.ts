import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { firestore } from "../../config/firebase.config";
import type {
  MessageCreated,
  MessageData,
} from "../../interfaces/message.interface";

const messages = firestore.collection("messages");
const contacts = firestore.collection("contacts");
const connections = firestore.collection("connections");

const requireAuth = (uid?: string): string => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return uid;
};

export const createMessage = onCall(
  async (request: CallableRequest<any>): Promise<MessageData> => {
    const ownerId = requireAuth(request.auth?.uid);

    const { connectionId, contactIds, message, scheduledAt } =
      request.data ?? {};

    if (!connectionId) {
      throw new HttpsError("invalid-argument", "Connection is required.");
    }

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "At least one contact is required.",
      );
    }

    if (!message?.trim()) {
      throw new HttpsError("invalid-argument", "Message is required.");
    }

    const connection = await connections.doc(connectionId).get();

    if (!connection.exists || connection.data()?.ownerId !== ownerId) {
      throw new HttpsError("not-found", "Connection not found.");
    }

    const contactSnapshots = await Promise.all(
      contactIds.map((id: string) => contacts.doc(id).get()),
    );

    const validContacts = contactSnapshots.every(
      (snapshot) =>
        snapshot.exists &&
        snapshot.data()?.ownerId === ownerId &&
        snapshot.data()?.connectionId === connectionId,
    );

    if (!validContacts) {
      throw new HttpsError(
        "permission-denied",
        "One or more contacts are invalid.",
      );
    }

    const date = scheduledAt
      ? Timestamp.fromDate(new Date(`${scheduledAt}:00-03:00`))
      : null;

    const isScheduled = date !== null;

    if (date && date.toMillis() <= Date.now()) {
      throw new HttpsError(
        "invalid-argument",
        "Scheduled date must be in the future.",
      );
    }

    const ref = messages.doc();

    await ref.set({
      ownerId,
      connectionId,
      contactIds,
      message: message.trim(),
      status: isScheduled ? "scheduled" : "sent",
      scheduledAt: date,
      sentAt: isScheduled ? null : FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      id: ref.id,
      status: isScheduled ? "scheduled" : "sent",
    };
  },
);

export const updateMessage = onCall(
  async (request: CallableRequest<any>): Promise<MessageCreated> => {
    const ownerId = requireAuth(request.auth?.uid);

    const { id, message, contactIds, scheduledAt } = request.data ?? {};

    const ref = messages.doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
      throw new HttpsError("not-found", "Message not found.");
    }

    const current = snapshot.data();

    if (current?.status === "sent") {
      throw new HttpsError(
        "failed-precondition",
        "Sent messages cannot be edited.",
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (message !== undefined) {
      if (!String(message).trim()) {
        throw new HttpsError("invalid-argument", "Message is required.");
      }

      updates.message = String(message).trim();
    }

    if (contactIds !== undefined) {
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        throw new HttpsError(
          "invalid-argument",
          "At least one contact is required.",
        );
      }

      updates.contactIds = contactIds;
    }

    if (scheduledAt !== undefined) {
      const date = Timestamp.fromDate(new Date(scheduledAt));

      if (date.toMillis() <= Date.now()) {
        throw new HttpsError(
          "invalid-argument",
          "Scheduled date must be in the future.",
        );
      }

      updates.scheduledAt = date;
    }

    await ref.update(updates);

    return { success: true };
  },
);

export const deleteMessage = onCall(
  async (request: CallableRequest<any>): Promise<MessageCreated> => {
    const ownerId = requireAuth(request.auth?.uid);

    const id = request.data?.id;

    if (!id) {
      throw new HttpsError("invalid-argument", "message id is required.");
    }

    const ref = messages.doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
      throw new HttpsError("not-found", "Message not found.");
    }

    await ref.delete();

    return { success: true };
  },
);
