import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { expect } from "vitest";

type Handler = (request: CallableRequest<unknown>) => Promise<unknown>;

export const invoke = (
  fn: unknown,
  data?: unknown,
  uid: string | null = "user-1",
): Promise<unknown> =>
  (fn as Handler)({
    auth: uid ? { uid } : undefined,
    data,
  } as unknown as CallableRequest<unknown>);

export const expectHttpsError = async (
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

export const snapshotOf = (data?: Record<string, unknown>) => ({
  exists: data !== undefined,
  data: () => data,
});
