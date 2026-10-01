import { Timestamp } from "firebase-admin/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({
  options: undefined as unknown,
  handler: undefined as (() => Promise<void>) | undefined,
}));

const db = vi.hoisted(() => ({
  get: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  update: vi.fn(),
  commit: vi.fn(),
  batch: vi.fn(),
}));

const log = vi.hoisted(() => ({
  debug: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  write: vi.fn(),
}));

vi.mock("firebase-functions/v2/scheduler", () => ({
  onSchedule: (options: unknown, handler: () => Promise<void>) => {
    captured.options = options;
    captured.handler = handler;
    return handler;
  },
}));

// import * as logger from "firebase-functions/logger"  |  import { info } from "firebase-functions/logger"
vi.mock("firebase-functions/logger", () => log);

// import { logger } from "firebase-functions"
vi.mock("firebase-functions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase-functions")>()),
  logger: log,
}));

vi.mock("../../config/firebase.config", () => ({
  firestore: {
    collection: () => ({ where: db.where }),
    batch: db.batch,
  },
}));

import "./scheduled.func";

const NOW = new Date("2026-10-01T12:00:00.000Z");

const run = (): Promise<void> => {
  if (!captured.handler) {
    throw new Error("processScheduledMessages did not register a handler");
  }
  return captured.handler();
};

const logged = (): string[] =>
  [...log.info.mock.calls, ...log.log.mock.calls].map(([message]) =>
    String(message),
  );

const snapshotOf = (ids: string[]) => ({
  empty: ids.length === 0,
  size: ids.length,
  docs: ids.map((id) => ({ ref: { id } })),
});

describe("processScheduledMessages", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    vi.resetAllMocks();

    const query = { where: db.where, limit: db.limit, get: db.get };
    db.where.mockReturnValue(query);
    db.limit.mockReturnValue(query);
    db.batch.mockReturnValue({ update: db.update, commit: db.commit });
    db.commit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is registered to run every minute in southamerica-east1", () => {
    expect(captured.options).toEqual(
      expect.objectContaining({
        schedule: "every minute",
        region: "southamerica-east1",
      }),
    );
  });

  it("queries only scheduled messages that are due, capped at 100 per run", async () => {
    db.get.mockResolvedValue(snapshotOf([]));

    await run();

    expect(db.where).toHaveBeenNthCalledWith(1, "status", "==", "scheduled");
    expect(db.where).toHaveBeenNthCalledWith(
      2,
      "scheduledAt",
      "<=",
      Timestamp.fromDate(NOW),
    );
    expect(db.limit).toHaveBeenCalledWith(100);
  });

  it("does nothing when no message is due", async () => {
    db.get.mockResolvedValue(snapshotOf([]));

    await run();

    expect(db.batch).not.toHaveBeenCalled();
    expect(db.commit).not.toHaveBeenCalled();
    expect(logged()).toContain("No scheduled messages to process.");
  });

  it("marks every due message as sent with the same timestamp, in a single batch", async () => {
    const snapshot = snapshotOf(["m1", "m2", "m3"]);
    db.get.mockResolvedValue(snapshot);
    const now = Timestamp.fromDate(NOW);

    await run();

    expect(db.batch).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(3);
    snapshot.docs.forEach((doc) => {
      expect(db.update).toHaveBeenCalledWith(doc.ref, {
        status: "sent",
        sentAt: now,
        updatedAt: now,
      });
    });
    expect(db.commit).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("Processed 3 scheduled broadcasts.");
  });

  it("commits only after every update has been queued", async () => {
    db.get.mockResolvedValue(snapshotOf(["m1", "m2"]));

    await run();

    const lastUpdate = Math.max(...db.update.mock.invocationCallOrder);
    expect(db.commit.mock.invocationCallOrder[0]).toBeGreaterThan(lastUpdate);
  });

  it("rejects when the query fails, so the failure shows up in the function logs", async () => {
    db.get.mockRejectedValue(
      new Error("FAILED_PRECONDITION: the query requires an index"),
    );

    await expect(run()).rejects.toThrow("FAILED_PRECONDITION");
    expect(db.commit).not.toHaveBeenCalled();
  });

  it("rejects when the batch commit fails and does not report success", async () => {
    db.get.mockResolvedValue(snapshotOf(["m1"]));
    db.commit.mockRejectedValue(new Error("commit failed"));

    await expect(run()).rejects.toThrow("commit failed");
    expect(logged().some((message) => message.includes("Processed"))).toBe(
      false,
    );
  });
});
