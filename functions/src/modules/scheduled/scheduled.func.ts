import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { firestore } from "../../config/firebase.config";
import { logger } from "firebase-functions";

const messages = firestore.collection("messages");

export const processScheduledMessages = onSchedule(
  {
    schedule: "every minute",
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
      logger.log("No scheduled messages to process.");
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

    logger.info(`Processed ${snapshot.size} scheduled broadcasts.`);
  },
);
