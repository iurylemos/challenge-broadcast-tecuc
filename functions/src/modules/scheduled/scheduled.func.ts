import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { firestore } from "../../config/firebase.config";

const messages = firestore.collection("messages");

export const processScheduledMessages = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async (): Promise<void> => {
    const now = Timestamp.now();

    const snapshot = await messages
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(100)
      .get();

    if (snapshot.empty) {
      console.log("No scheduled messages to process.");
      return;
    }

    const batch = firestore.batch();

    snapshot.docs.forEach((document) => {
      batch.update(document.ref, {
        status: "sent",
        sentAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    console.log(`Processed ${snapshot.size} scheduled broadcasts.`);
  },
);
