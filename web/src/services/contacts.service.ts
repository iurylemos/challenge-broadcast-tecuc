import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { db, functions } from "../config/firebase.config";
import type { Contact } from "../interfaces/contact.interface";
import type {
  FirebaseFunctionDelete,
  FirebaseFunctionResponseStatus,
} from "../interfaces/firebase.interface";

type CreateContact = Omit<Contact, "id">;
type UpdateContact = Omit<Contact, "connectionId">;

const contactsCollection = collection(db, "contacts");

const createContactFunction = httpsCallable<CreateContact, Contact>(
  functions,
  "createContact",
);

const updateContactFunction = httpsCallable<UpdateContact, UpdateContact>(
  functions,
  "updateContact",
);

const deleteContactFunction = httpsCallable<
  FirebaseFunctionDelete,
  FirebaseFunctionResponseStatus
>(functions, "deleteContact");

export class ContactsService {
  public static async create(
    connectionId: string,
    name: string,
    phone: string,
  ): Promise<Contact> {
    const result: HttpsCallableResult<Contact> = await createContactFunction({
      connectionId,
      name,
      phone,
    });

    return result.data;
  }

  public static async update(
    id: string,
    name: string,
    phone: string,
  ): Promise<UpdateContact> {
    const result: HttpsCallableResult<UpdateContact> =
      await updateContactFunction({
        id,
        name,
        phone,
      });

    return result.data;
  }

  public static async delete(id: string): Promise<void> {
    await deleteContactFunction({ id });
  }

  public static subscribe(
    ownerId: string,
    connectionId: string,
    onChange: (contacts: Contact[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    const contactsQuery = query(
      contactsCollection,
      where("ownerId", "==", ownerId),
      where("connectionId", "==", connectionId),
    );

    return onSnapshot(
      contactsQuery,
      (snapshot) => {
        const contacts: Contact[] = snapshot.docs.map((document) => ({
          id: document.id,
          connectionId: document.data().connectionId,
          name: document.data().name,
          phone: document.data().phone,
        }));

        onChange(contacts);
      },
      onError,
    );
  }
}
