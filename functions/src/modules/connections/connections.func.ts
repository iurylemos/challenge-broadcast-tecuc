import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { firestore } from "../../config/firebase.config";

const connections = firestore.collection("connections");

const requireAuth = (uid?: string): string => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return uid;
};

export const createConnection = onCall(async (request) => {
  const ownerId = requireAuth(request.auth?.uid);

  const name = String(request.data?.name ?? "").trim();

  if (!name) {
    throw new HttpsError("invalid-argument", "Connection name is required.");
  }

  const ref = connections.doc();

  await ref.set({
    ownerId,
    name,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    id: ref.id,
    name,
  };
});

export const updateConnection = onCall(async (request) => {
  const ownerId = requireAuth(request.auth?.uid);

  const { id, name } = request.data ?? {};

  if (!id || !name?.trim()) {
    throw new HttpsError(
      "invalid-argument",
      "Connection id and name are required.",
    );
  }

  const ref = connections.doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
    throw new HttpsError("not-found", "Connection not found.");
  }

  await ref.update({
    name: name.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id, name: name.trim() };
});

export const deleteConnection = onCall(async (request) => {
  const ownerId = requireAuth(request.auth?.uid);

  const id = request.data?.id;

  if (!id) {
    throw new HttpsError("invalid-argument", "Connection id is required.");
  }

  const ref = connections.doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.ownerId !== ownerId) {
    throw new HttpsError("not-found", "Connection not found.");
  }

  await ref.delete();

  return { success: true };
});
