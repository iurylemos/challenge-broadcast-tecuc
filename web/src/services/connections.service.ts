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
import type {
  Connection,
  ConnectionStatus,
} from "../interfaces/connection.interface";

type CreateConnection = Omit<Connection, "id">;
type DeleteConnection = Omit<Connection, "name">;

const connectionsCollection = collection(db, "connections");

const createConnectionFunction = httpsCallable<CreateConnection, Connection>(
  functions,
  "createConnection",
);

const updateConnectionFunction = httpsCallable<Connection, Connection>(
  functions,
  "updateConnection",
);

const deleteConnectionFunction = httpsCallable<
  DeleteConnection,
  ConnectionStatus
>(functions, "deleteConnection");

export class ConnectionsService {
  public static async create(name: string): Promise<Connection> {
    const result: HttpsCallableResult<Connection> =
      await createConnectionFunction({ name });

    return result.data;
  }

  public static async update(id: string, name: string): Promise<Connection> {
    const result: HttpsCallableResult<Connection> =
      await updateConnectionFunction({
        id,
        name,
      });

    return result.data;
  }

  public static async delete(id: string): Promise<void> {
    await deleteConnectionFunction({ id });
  }

  public static subscribe(
    ownerId: string,
    onChange: (connections: Connection[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const connectionsQuery = query(
      connectionsCollection,
      where("ownerId", "==", ownerId),
    );

    return onSnapshot(
      connectionsQuery,
      (snapshot: QuerySnapshot<DocumentData, DocumentData>): void => {
        const connections: Connection[] = snapshot.docs.map((document) => ({
          id: document.id,
          name: document.data().name,
        }));

        onChange(connections);
      },
      onError,
    );
  }
}
