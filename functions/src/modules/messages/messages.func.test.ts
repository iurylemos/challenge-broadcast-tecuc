import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CALLABLE_OPTIONS = vi.hoisted(() => ({
  region: "callable-options-sentinel",
}));
const captured = vi.hoisted(() => ({ options: [] as unknown[] }));

const store = vi.hoisted(() => ({
  connections: new Map<string, Record<string, unknown>>(),
  contacts: new Map<string, Record<string, unknown>>(),
  messages: new Map<string, Record<string, unknown>>(),
}));

const db = vi.hoisted(() => ({
  messagesDoc: vi.fn(),
  contactsDoc: vi.fn(),
  connectionsDoc: vi.fn(),
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
      doc: {
        messages: db.messagesDoc,
        contacts: db.contactsDoc,
        connections: db.connectionsDoc,
      }[name],
    }),
  },
}));

import { createMessage, deleteMessage, updateMessage } from "./messages";

type Handler = (request: CallableRequest<unknown>) => Promise<unknown>;

const OWNER = "user-1";
const OTHER = "user-2";
const NEW_ID = "new-msg-id";
const NOW = new Date("2026-10-01T12:00:00.000Z"); // 09:00 in -03:00
const FUTURE_ISO = "2030-01-01T13:00:00.000Z";
const PAST_ISO = "2020-01-01T13:00:00.000Z";

const VALID = {
  connectionId: "conn-1",
  contactIds: ["c1", "c2"],
  message: "Hello",
};

const invoke = (
  fn: unknown,
  data?: unknown,
  uid: string | null = OWNER,
): Promise<unknown> =>
  (fn as Handler)({
    auth: uid ? { uid } : undefined,
    data,
  } as unknown as CallableRequest<unknown>);

const expectHttpsError = async (
  call: Promise<unknown>,
  code: string,
  message?: string,
): Promise<void> => {
  const error = await call.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(HttpsError);
  expect((error as HttpsError).code).toBe(code);
  if (message) {
    expect((error as HttpsError).message).toBe(message);
  }
};

const serverTs = () => FieldValue.serverTimestamp();
const at = (iso: string) => Timestamp.fromDate(new Date(iso));
const snapshotOf = (data?: Record<string, unknown>) => ({
  exists: data !== undefined,
  data: () => data,
});

const contactDoc = (overrides: Record<string, unknown> = {}) => ({
  ownerId: OWNER,
  connectionId: "conn-1",
  name: "Alice",
  phone: "85911111111",
  ...overrides,
});

const messageDoc = (overrides: Record<string, unknown> = {}) => ({
  ownerId: OWNER,
  connectionId: "conn-1",
  contactIds: ["c1"],
  message: "Existing",
  status: "scheduled",
  ...overrides,
});

const seed = (): void => {
  store.connections.clear();
  store.contacts.clear();
  store.messages.clear();

  store.connections.set("conn-1", { ownerId: OWNER, name: "Loja" });
  store.connections.set("conn-other", { ownerId: OTHER, name: "Outra" });

  store.contacts.set("c1", contactDoc());
  store.contacts.set("c2", contactDoc());
  store.contacts.set("c-foreign", contactDoc({ ownerId: OTHER }));
  store.contacts.set("c-other-conn", contactDoc({ connectionId: "conn-2" }));

  store.messages.set("m-scheduled", messageDoc());
  store.messages.set("m-sent", messageDoc({ status: "sent" }));
  store.messages.set("m-foreign", messageDoc({ ownerId: OTHER }));
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.resetAllMocks();
  seed();

  db.connectionsDoc.mockImplementation((id: string) => ({
    get: async () => snapshotOf(store.connections.get(id)),
  }));
  db.contactsDoc.mockImplementation((id: string) => ({
    get: async () => snapshotOf(store.contacts.get(id)),
  }));
  db.messagesDoc.mockImplementation((id?: string) => ({
    id: id ?? NEW_ID,
    get: async () =>
      snapshotOf(id === undefined ? undefined : store.messages.get(id)),
    set: db.set,
    update: db.update,
    delete: db.remove,
  }));
  db.set.mockResolvedValue(undefined);
  db.update.mockResolvedValue(undefined);
  db.remove.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("messages callables", () => {
  it("registers the three callables with the shared options", () => {
    expect(captured.options).toHaveLength(3);
    captured.options.forEach((options) =>
      expect(options).toBe(CALLABLE_OPTIONS),
    );
  });
});

describe("createMessage", () => {
  describe("authentication and input validation", () => {
    it("rejects unauthenticated calls before touching Firestore", async () => {
      await expectHttpsError(
        invoke(createMessage, VALID, null),
        "unauthenticated",
        "Authentication is required.",
      );

      expect(db.connectionsDoc).not.toHaveBeenCalled();
      expect(db.set).not.toHaveBeenCalled();
    });

    it("rejects a call without data", async () => {
      await expectHttpsError(
        invoke(createMessage, undefined),
        "invalid-argument",
        "Connection is required.",
      );
    });

    it.each([
      [
        "a missing connection",
        { contactIds: ["c1"], message: "Hi" },
        "Connection is required.",
      ],
      [
        "missing contacts",
        { connectionId: "conn-1", message: "Hi" },
        "At least one contact is required.",
      ],
      [
        "contacts that are not an array",
        { connectionId: "conn-1", contactIds: "c1", message: "Hi" },
        "At least one contact is required.",
      ],
      [
        "an empty contact list",
        { connectionId: "conn-1", contactIds: [], message: "Hi" },
        "At least one contact is required.",
      ],
      [
        "a missing message",
        { connectionId: "conn-1", contactIds: ["c1"] },
        "Message is required.",
      ],
      [
        "a blank message",
        { connectionId: "conn-1", contactIds: ["c1"], message: "   " },
        "Message is required.",
      ],
    ])("rejects %s", async (_label, data, message) => {
      await expectHttpsError(
        invoke(createMessage, data),
        "invalid-argument",
        message,
      );

      expect(db.connectionsDoc).not.toHaveBeenCalled();
      expect(db.set).not.toHaveBeenCalled();
    });
  });

  describe("tenant isolation", () => {
    it.each([
      ["does not exist", "ghost-conn"],
      ["belongs to another user", "conn-other"],
    ])(
      "answers not-found when the connection %s (no existence leak)",
      async (_label, connectionId) => {
        await expectHttpsError(
          invoke(createMessage, { ...VALID, connectionId }),
          "not-found",
          "Connection not found.",
        );

        expect(db.set).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["does not exist", "ghost"],
      ["belongs to another user", "c-foreign"],
      ["belongs to another connection", "c-other-conn"],
    ])("rejects a contact that %s", async (_label, badContactId) => {
      await expectHttpsError(
        invoke(createMessage, { ...VALID, contactIds: ["c1", badContactId] }),
        "permission-denied",
        "One or more contacts are invalid.",
      );

      expect(db.set).not.toHaveBeenCalled();
    });

    it("checks every contact id", async () => {
      await invoke(createMessage, VALID);

      expect(db.contactsDoc).toHaveBeenCalledWith("c1");
      expect(db.contactsDoc).toHaveBeenCalledWith("c2");
    });

    it("takes ownerId from the auth token and ignores client-supplied fields", async () => {
      await invoke(createMessage, {
        ...VALID,
        scheduledAt: "2030-01-01T10:00",
        ownerId: OTHER,
        status: "sent",
        sentAt: "forged",
      });

      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: OWNER,
          status: "scheduled",
          sentAt: null,
        }),
      );
    });
  });

  describe("immediate send", () => {
    it("stores a sent message with a trimmed body and returns its id", async () => {
      const result = await invoke(createMessage, {
        ...VALID,
        message: "  Hello  ",
      });

      expect(result).toEqual({ id: NEW_ID, status: "sent" });
      expect(db.messagesDoc).toHaveBeenCalledWith();
      expect(db.set).toHaveBeenCalledWith({
        ownerId: OWNER,
        connectionId: "conn-1",
        contactIds: ["c1", "c2"],
        message: "Hello",
        status: "sent",
        scheduledAt: null,
        sentAt: serverTs(),
        createdAt: serverTs(),
        updatedAt: serverTs(),
      });
    });

    it("treats an empty scheduledAt as an immediate send", async () => {
      const result = await invoke(createMessage, { ...VALID, scheduledAt: "" });

      expect(result).toEqual({ id: NEW_ID, status: "sent" });
    });
  });

  describe("scheduled send", () => {
    it("stores a scheduled message interpreting scheduledAt as UTC-3", async () => {
      const result = await invoke(createMessage, {
        ...VALID,
        scheduledAt: "2030-01-01T10:00",
      });

      expect(result).toEqual({ id: NEW_ID, status: "scheduled" });
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "scheduled",
          scheduledAt: at("2030-01-01T13:00:00.000Z"),
          sentAt: null,
        }),
      );
    });

    it("rejects a date in the past", async () => {
      await expectHttpsError(
        invoke(createMessage, { ...VALID, scheduledAt: "2020-01-01T10:00" }),
        "invalid-argument",
        "Scheduled date must be in the future.",
      );

      expect(db.set).not.toHaveBeenCalled();
    });

    it("rejects a date equal to now and accepts one minute later", async () => {
      await expectHttpsError(
        invoke(createMessage, { ...VALID, scheduledAt: "2026-10-01T09:00" }),
        "invalid-argument",
        "Scheduled date must be in the future.",
      );

      await invoke(createMessage, {
        ...VALID,
        scheduledAt: "2026-10-01T09:01",
      });

      expect(db.set).toHaveBeenCalledTimes(1);
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: at("2026-10-01T12:01:00.000Z"),
        }),
      );
    });
  });
});

describe("updateMessage", () => {
  describe("authentication and tenant isolation", () => {
    it("rejects unauthenticated calls", async () => {
      await expectHttpsError(
        invoke(updateMessage, { id: "m-scheduled", message: "x" }, null),
        "unauthenticated",
      );

      expect(db.update).not.toHaveBeenCalled();
    });

    it.each([
      ["does not exist", "ghost"],
      ["belongs to another user", "m-foreign"],
    ])("answers not-found when the message %s", async (_label, id) => {
      await expectHttpsError(
        invoke(updateMessage, { id, message: "x" }),
        "not-found",
        "Message not found.",
      );

      expect(db.update).not.toHaveBeenCalled();
    });

    it("does not allow editing a message that was already sent", async () => {
      await expectHttpsError(
        invoke(updateMessage, { id: "m-sent", message: "x" }),
        "failed-precondition",
        "Sent messages cannot be edited.",
      );

      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe("field updates", () => {
    it("updates only the provided fields", async () => {
      const result = await invoke(updateMessage, {
        id: "m-scheduled",
        message: "  Updated  ",
      });

      expect(result).toEqual({ success: true });
      expect(db.messagesDoc).toHaveBeenCalledWith("m-scheduled");
      expect(db.update).toHaveBeenCalledWith({
        updatedAt: serverTs(),
        message: "Updated",
      });
    });

    it("never writes ownership or status fields sent by the client", async () => {
      await invoke(updateMessage, {
        id: "m-scheduled",
        message: "New",
        contactIds: ["c1", "c2"],
        scheduledAt: FUTURE_ISO,
        ownerId: OTHER,
        status: "sent",
        connectionId: "conn-2",
      });

      const payload = db.update.mock.calls[0][0] as Record<string, unknown>;

      expect(Object.keys(payload).sort()).toEqual([
        "contactIds",
        "message",
        "scheduledAt",
        "updatedAt",
      ]);
      expect(payload).toMatchObject({
        message: "New",
        contactIds: ["c1", "c2"],
        scheduledAt: at(FUTURE_ISO),
      });
    });

    it.each([
      ["an empty string", ""],
      ["only spaces", "   "],
    ])("rejects a message made of %s", async (_label, message) => {
      await expectHttpsError(
        invoke(updateMessage, { id: "m-scheduled", message }),
        "invalid-argument",
        "Message is required.",
      );

      expect(db.update).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty list", []],
      ["a non-array value", "c1"],
    ])("rejects contactIds as %s", async (_label, contactIds) => {
      await expectHttpsError(
        invoke(updateMessage, { id: "m-scheduled", contactIds }),
        "invalid-argument",
        "At least one contact is required.",
      );

      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe("rescheduling", () => {
    it("accepts a future date", async () => {
      await invoke(updateMessage, {
        id: "m-scheduled",
        scheduledAt: FUTURE_ISO,
      });

      expect(db.update).toHaveBeenCalledWith({
        updatedAt: serverTs(),
        scheduledAt: at(FUTURE_ISO),
      });
    });

    it.each([
      ["in the past", PAST_ISO],
      ["equal to now", NOW.toISOString()],
    ])("rejects a date %s", async (_label, scheduledAt) => {
      await expectHttpsError(
        invoke(updateMessage, { id: "m-scheduled", scheduledAt }),
        "invalid-argument",
        "Scheduled date must be in the future.",
      );

      expect(db.update).not.toHaveBeenCalled();
    });
  });
});

describe("deleteMessage", () => {
  it("rejects unauthenticated calls", async () => {
    await expectHttpsError(
      invoke(deleteMessage, { id: "m-scheduled" }, null),
      "unauthenticated",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it("requires an id and does not read Firestore without it", async () => {
    await expectHttpsError(
      invoke(deleteMessage, {}),
      "invalid-argument",
      "message id is required.",
    );

    expect(db.messagesDoc).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost"],
    ["belongs to another user", "m-foreign"],
  ])("answers not-found when the message %s", async (_label, id) => {
    await expectHttpsError(
      invoke(deleteMessage, { id }),
      "not-found",
      "Message not found.",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it.each([
    ["scheduled", "m-scheduled"],
    ["sent", "m-sent"],
  ])("deletes an own %s message", async (_status, id) => {
    const result = await invoke(deleteMessage, { id });

    expect(result).toEqual({ success: true });
    expect(db.messagesDoc).toHaveBeenCalledWith(id);
    expect(db.remove).toHaveBeenCalledTimes(1);
  });
});
