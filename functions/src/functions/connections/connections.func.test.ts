import { FieldValue } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectHttpsError, invoke, snapshotOf } from "../../tests/helpers";

const CALLABLE_OPTIONS = vi.hoisted(() => ({
  region: "southamerica-east1",
}));
const captured = vi.hoisted(() => ({ options: [] as unknown[] }));

const store = vi.hoisted(() => ({
  connections: new Map<string, Record<string, unknown>>(),
}));

const db = vi.hoisted(() => ({
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
      doc: { connections: db.connectionsDoc }[name],
    }),
  },
}));

import {
  createConnection,
  deleteConnection,
  updateConnection,
} from "./connections.func";

const OWNER = "user-1";
const OTHER = "user-2";
const NEW_ID = "new-connection-id";
const serverTs = () => FieldValue.serverTimestamp();

beforeEach(() => {
  vi.resetAllMocks();

  store.connections.clear();
  store.connections.set("conn-1", { ownerId: OWNER, name: "Loja" });
  store.connections.set("conn-other", { ownerId: OTHER, name: "Outra" });

  db.connectionsDoc.mockImplementation((id?: string) => ({
    id: id ?? NEW_ID,
    get: async () =>
      snapshotOf(id === undefined ? undefined : store.connections.get(id)),
    set: db.set,
    update: db.update,
    delete: db.remove,
  }));
  db.set.mockResolvedValue(undefined);
  db.update.mockResolvedValue(undefined);
  db.remove.mockResolvedValue(undefined);
});

describe("connections callables", () => {
  it("registers the three callables with the shared options", () => {
    expect(captured.options).toHaveLength(3);
    captured.options.forEach((options) =>
      expect(options).toStrictEqual(CALLABLE_OPTIONS),
    );
  });
});

describe("createConnection", () => {
  it("rejects unauthenticated calls before touching Firestore", async () => {
    await expectHttpsError(
      invoke(createConnection, { name: "Loja" }, null),
      "unauthenticated",
      "Authentication is required.",
    );

    expect(db.connectionsDoc).not.toHaveBeenCalled();
    expect(db.set).not.toHaveBeenCalled();
  });

  it.each([
    ["no data", undefined],
    ["a missing name", {}],
    ["a blank name", { name: "   " }],
  ])("rejects %s", async (_label, data) => {
    await expectHttpsError(
      invoke(createConnection, data),
      "invalid-argument",
      "Connection name is required.",
    );

    expect(db.set).not.toHaveBeenCalled();
  });

  it("stores the connection with a trimmed name for the authenticated user", async () => {
    const result = await invoke(createConnection, { name: "  Loja Norte  " });

    expect(result).toEqual({ id: NEW_ID, name: "Loja Norte" });
    expect(db.set).toHaveBeenCalledWith({
      ownerId: OWNER,
      name: "Loja Norte",
      createdAt: serverTs(),
      updatedAt: serverTs(),
    });
  });

  it("takes ownerId from the auth token and ignores a client-supplied one", async () => {
    await invoke(createConnection, { name: "Loja", ownerId: OTHER });

    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: OWNER }),
    );
  });
});

describe("updateConnection", () => {
  it("rejects unauthenticated calls", async () => {
    await expectHttpsError(
      invoke(updateConnection, { id: "conn-1", name: "X" }, null),
      "unauthenticated",
    );

    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    ["no data", undefined],
    ["a missing id", { name: "Loja" }],
    ["a missing name", { id: "conn-1" }],
    ["a blank name", { id: "conn-1", name: "   " }],
  ])("rejects %s", async (_label, data) => {
    await expectHttpsError(
      invoke(updateConnection, data),
      "invalid-argument",
      "Connection id and name are required.",
    );

    expect(db.connectionsDoc).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost"],
    ["belongs to another user", "conn-other"],
  ])("answers not-found when the connection %s", async (_label, id) => {
    await expectHttpsError(
      invoke(updateConnection, { id, name: "New" }),
      "not-found",
      "Connection not found.",
    );

    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates only name and updatedAt with the trimmed name", async () => {
    const result = await invoke(updateConnection, {
      id: "conn-1",
      name: "  Loja Sul  ",
      ownerId: OTHER,
    });

    expect(result).toEqual({ id: "conn-1", name: "Loja Sul" });
    expect(db.connectionsDoc).toHaveBeenCalledWith("conn-1");
    expect(db.update).toHaveBeenCalledWith({
      name: "Loja Sul",
      updatedAt: serverTs(),
    });
  });
});

describe("deleteConnection", () => {
  it("rejects unauthenticated calls", async () => {
    await expectHttpsError(
      invoke(deleteConnection, { id: "conn-1" }, null),
      "unauthenticated",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it("requires an id and does not read Firestore without it", async () => {
    await expectHttpsError(
      invoke(deleteConnection, {}),
      "invalid-argument",
      "Connection id is required.",
    );

    expect(db.connectionsDoc).not.toHaveBeenCalled();
  });

  it.each([
    ["does not exist", "ghost"],
    ["belongs to another user", "conn-other"],
  ])("answers not-found when the connection %s", async (_label, id) => {
    await expectHttpsError(
      invoke(deleteConnection, { id }),
      "not-found",
      "Connection not found.",
    );

    expect(db.remove).not.toHaveBeenCalled();
  });

  it("deletes an own connection", async () => {
    const result = await invoke(deleteConnection, { id: "conn-1" });

    expect(result).toEqual({ success: true });
    expect(db.connectionsDoc).toHaveBeenCalledWith("conn-1");
    expect(db.remove).toHaveBeenCalledTimes(1);
  });
});
