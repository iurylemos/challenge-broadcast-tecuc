import {
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { db, functions } from "../config/firebase.config";
import type { Message } from "../interfaces/message.interface";
import type { FirebaseFunctionResponseStatus } from "../interfaces/firebase.interface";

type CreateMessage = Pick<
  Message,
  "connectionId" | "contactIds" | "message" | "scheduledAt"
>;

type CreateMessageData = Pick<Message, "id" | "status">;

type UpdateMessage = Pick<
  Message,
  "id" | "contactIds" | "message" | "scheduledAt"
>;

type DeleteMessage = Pick<Message, "id">;

const messagesCollection = collection(db, "messages");

const createMessageFunction = httpsCallable<CreateMessage, CreateMessageData>(
  functions,
  "createMessage",
);

const updateMessageFunction = httpsCallable<
  UpdateMessage,
  FirebaseFunctionResponseStatus
>(functions, "updateMessage");

const deleteMessageFunction = httpsCallable<
  DeleteMessage,
  FirebaseFunctionResponseStatus
>(functions, "deleteMessage");

export class MessagesService {
  public static async create(
    payload: CreateMessage,
  ): Promise<CreateMessageData> {
    const result: HttpsCallableResult<CreateMessageData> =
      await createMessageFunction(payload);

    return result.data;
  }

  public static async update(
    payload: UpdateMessage,
  ): Promise<FirebaseFunctionResponseStatus> {
    const result: HttpsCallableResult<FirebaseFunctionResponseStatus> =
      await updateMessageFunction(payload);

    return result.data;
  }

  public static async delete(id: string): Promise<void> {
    await deleteMessageFunction({ id });
  }

  public static subscribe(
    ownerId: string,
    connectionId: string,
    onChange: (messages: Message[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const messagesQuery = query(
      messagesCollection,
      where("ownerId", "==", ownerId),
      where("connectionId", "==", connectionId),
    );

    return onSnapshot(
      messagesQuery,
      (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const messages: Message[] = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,
            connectionId: data.connectionId,
            contactIds: data.contactIds ?? [],
            message: data.message,
            status: data.status,
            scheduledAt: data.scheduledAt,
            sentAt: data.sentAt,
            ownerId: data.ownerId,
          };
        });

        onChange(messages);
      },
      onError,
    );
  }
}
