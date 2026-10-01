import { FieldValue } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { firestore } from "../../config/firebase.config";
import type { MessageCreated } from "../../interfaces/message.interface";

const contacts = firestore.collection("contacts");
const connections = firestore.collection("connections");

const requireAuth = (uid?: string): string => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return uid;
};

const validateConnection = async (
  connectionId: string,
  ownerId: string,
): Promise<void> => {
  const snapshot = await connections.doc(connectionId).get();

  if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
    throw new HttpsError("not-found", "Connection not found.");
  }
};

export const createContact = onCall(async (request: CallableRequest<any>) => {
  const ownerId = requireAuth(request.auth?.uid);

  const { connectionId, name, phone } = request.data ?? {};

  if (!connectionId || !name?.trim() || !phone?.trim()) {
    throw new HttpsError(
      "invalid-argument",
      "Connection, name and phone are required.",
    );
  }

  await validateConnection(connectionId, ownerId);

  const ref = contacts.doc();

  await ref.set({
    ownerId,
    connectionId,
    name: name.trim(),
    phone: phone.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id: ref.id,
    connectionId,
    name: name.trim(),
    phone: phone.trim(),
  };
});

export const updateContact = onCall(async (request: CallableRequest<any>) => {
  const ownerId = requireAuth(request.auth?.uid);

  const { id, name, phone } = request.data ?? {};

  if (!id || !name?.trim() || !phone?.trim()) {
    throw new HttpsError(
      "invalid-argument",
      "Contact id, name and phone are required.",
    );
  }

  const ref = contacts.doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
    throw new HttpsError("not-found", "Contact not found.");
  }

  await ref.update({
    name: name.trim(),
    phone: phone.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id,
    name: name.trim(),
    phone: phone.trim(),
  };
});

export const deleteContact = onCall(
  async (request: CallableRequest<any>): Promise<MessageCreated> => {
    const ownerId = requireAuth(request.auth?.uid);

    const id = request.data?.id;

    if (!id) {
      throw new HttpsError("invalid-argument", "Contact id is required.");
    }

    const ref = contacts.doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
      throw new HttpsError("not-found", "Contact not found.");
    }

    await ref.delete();

    return { success: true };
  },
);
