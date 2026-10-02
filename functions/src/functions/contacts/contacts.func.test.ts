import { FieldValue } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectHttpsError, invoke, snapshotOf } from "../../tests/helpers";

const CALLABLE_OPTIONS = vi.hoisted(() => ({
  region: "southamerica-east1",
}));
const captured = vi.hoisted(() => ({ options: [] as unknown[] }));

const store = vi.hoisted(() => ({
  connections: new Map<string, Record<string, unknown>>(),
  contacts: new Map<string, Record<string, unknown>>(),
}));

const db = vi.hoisted(() => ({
  connectionsDoc: vi.fn(),
  contactsDoc: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("firebase-functions/v2/https", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase-functions/v2/https")>()),
  onCall: (options: unknown, handler: unknown) => {
    captured.options.push(options);
    return handler;
  },
}));

vi.mock("../../utils/callable.util", () => ({
  CallableUtil: { callableOptionCall: CALLABLE_OPTIONS },
}));

vi.mock("../../config/firebase.config", () => ({
  firestore: {
    collection: (name: string) => ({
      doc: { contacts: db.contactsDoc, connections: db.connectionsDoc }[name],
    }),
  },
}));

import { createContact, deleteContact, updateContact } from "./contacts.func";

const OWNER = "user-1";
const OTHER = "user-2";
const NEW_ID = "new-contact-id";
const serverTs = () => FieldValue.serverTimestamp();

const VALID = { connectionId: "conn-1", name: "Alice", phone: "85911111111" };

beforeEach(() => {
  vi.resetAllMocks();

  store.connections.clear();
  store.contacts.clear();
  store.connections.set("conn-1", { ownerId: OWNER, name: "Loja" });
  store.connections.set("conn-other", { ownerId: OTHER, name: "Outra" });
  store.contacts.set("c1", {
    ownerId: OWNER,
    connectionId: "conn-1",
    name: "Alice",
    phone: "85911111111",
  });
  store.contacts.set("c-foreign", {
    ownerId: OTHER,
    connectionId: "conn-other",
    name: "Zed",
    phone: "85900000000",
  });

  db.connectionsDoc.mockImplementation((id: string) => ({
    get: async () => snapshotOf(store.connections.get(id)),
  }));
  db.contactsDoc.mockImplementation((id?: string) => ({
    id: id ?? NEW_ID,
    get: async () =>
      snapshotOf(id === undefined ? undefined : store.contacts.get(id)),
    set: db.set,
    update: db.update,
    delete: db.remove,
  }));
  db.set.mockResolvedValue(undefined);
  db.update.mockResolvedValue(undefined);
  db.remove.mockResolvedValue(undefined);
});

describe("contacts callables", () => {
  it("registers the three callables with the shared options", () => {
    expect(captured.options).toHaveLength(3);
    captured.options.forEach((options) =>
      expect(options).toStrictEqual(CALLABLE_OPTIONS),
    );
  });
});

describe("createContact", () => {
  it("rejects unauthenticated calls before touching Firestore", async () => {
    await expectHttpsError(
      invoke(createContact, VALID, null),
      "unauthenticated",
      "Authentication is required.",
    );

    expect(db.connectionsDoc).not.toHaveBeenCalled();
    expect(db.set).not.toHaveBeenCalled();
  });

  it.each([
    ["no data", undefined],
    ["a missing connection", { name: "Alice", phone: "85911111111" }],
    ["a missing name", { connectionId: "conn-1", phone: "85911111111" }],
    ["a blank name", { ...VALID, name: "   " }],
    ["a missing phone", { connectionId: "conn-1", name: "Alice" }],
    ["a blank phone", { ...VALID, phone: "   " }],
  ])("rejects %s", async (_label, data) => {
    await expectHttpsError(
      invoke(createContact, data),
      "invalid-argument",
      "Connection, name and phone are required.",
    );

    expect(db.connectionsDoc).not.toHaveBeenCalled();
    expect(db.set).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost-conn"],
    ["belongs to another user", "conn-other"],
  ])(
    "answers not-found when the connection %s (no existence leak)",
    async (_label, connectionId) => {
      await expectHttpsError(
        invoke(createContact, { ...VALID, connectionId }),
        "not-found",
        "Connection not found.",
      );

      expect(db.set).not.toHaveBeenCalled();
    },
  );

  it("stores the contact with trimmed fields and returns it", async () => {
    const result = await invoke(createContact, {
      connectionId: "conn-1",
      name: "  Alice  ",
      phone: " 85911111111 ",
    });

    expect(result).toEqual({
      id: NEW_ID,
      connectionId: "conn-1",
      name: "Alice",
      phone: "85911111111",
    });
    expect(db.set).toHaveBeenCalledWith({
      ownerId: OWNER,
      connectionId: "conn-1",
      name: "Alice",
      phone: "85911111111",
      createdAt: serverTs(),
      updatedAt: serverTs(),
    });
  });

  it("takes ownerId from the auth token and ignores a client-supplied one", async () => {
    await invoke(createContact, { ...VALID, ownerId: OTHER });

    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: OWNER }),
    );
  });
});

describe("updateContact", () => {
  it("rejects unauthenticated calls", async () => {
    await expectHttpsError(
      invoke(updateContact, { id: "c1", name: "A", phone: "1" }, null),
      "unauthenticated",
    );

    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    ["no data", undefined],
    ["a missing id", { name: "Alice", phone: "85911111111" }],
    ["a blank name", { id: "c1", name: "  ", phone: "85911111111" }],
    ["a blank phone", { id: "c1", name: "Alice", phone: "  " }],
  ])("rejects %s", async (_label, data) => {
    await expectHttpsError(
      invoke(updateContact, data),
      "invalid-argument",
      "Contact id, name and phone are required.",
    );

    expect(db.contactsDoc).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost"],
    ["belongs to another user", "c-foreign"],
  ])("answers not-found when the contact %s", async (_label, id) => {
    await expectHttpsError(
      invoke(updateContact, { id, name: "New", phone: "85922222222" }),
      "not-found",
      "Contact not found.",
    );

    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates name and phone with trimmed values and returns them", async () => {
    const result = await invoke(updateContact, {
      id: "c1",
      name: "  Alice Santos  ",
      phone: " 85922222222 ",
    });

    expect(result).toEqual({
      id: "c1",
      name: "Alice Santos",
      phone: "85922222222",
    });
    expect(db.contactsDoc).toHaveBeenCalledWith("c1");
    expect(db.update).toHaveBeenCalledWith({
      name: "Alice Santos",
      phone: "85922222222",
      updatedAt: serverTs(),
    });
  });

  it("never writes ownership fields sent by the client", async () => {
    await invoke(updateContact, {
      id: "c1",
      name: "Alice",
      phone: "85911111111",
      ownerId: OTHER,
      connectionId: "conn-other",
    });

    const payload = db.update.mock.calls[0][0] as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual(["name", "phone", "updatedAt"]);
  });
});

describe("deleteContact", () => {
  it("rejects unauthenticated calls", async () => {
    await expectHttpsError(
      invoke(deleteContact, { id: "c1" }, null),
      "unauthenticated",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it("requires an id and does not read Firestore without it", async () => {
    await expectHttpsError(
      invoke(deleteContact, {}),
      "invalid-argument",
      "Contact id is required.",
    );

    expect(db.contactsDoc).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost"],
    ["belongs to another user", "c-foreign"],
  ])("answers not-found when the contact %s", async (_label, id) => {
    await expectHttpsError(
      invoke(deleteContact, { id }),
      "not-found",
      "Contact not found.",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it("deletes an own contact", async () => {
    const result = await invoke(deleteContact, { id: "c1" });

    expect(result).toEqual({ success: true });
    expect(db.contactsDoc).toHaveBeenCalledWith("c1");
    expect(db.remove).toHaveBeenCalledTimes(1);
  });
});
