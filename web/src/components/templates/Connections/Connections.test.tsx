import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../../contexts/auth/auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { Connection } from "../../../interfaces/connection.interface";
import { ConnectionsService } from "../../../services/connections.service";
import { FirebaseService } from "../../../services/firebase.service";
import { RouterUtil } from "../../../utils/router.util";
import ConnectionsTemplate from "./index";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../../services/connections.service", () => ({
  ConnectionsService: {
    subscribe: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../services/firebase.service", () => ({
  FirebaseService: { signOut: vi.fn() },
}));

vi.mock("../../../utils/router.util", () => ({
  RouterUtil: { generateRouteContacts: vi.fn() },
}));

vi.mock("../../organisms/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("../../atoms/FooterConnections", () => ({
  default: ({
    user,
    signout,
  }: {
    user: { uid: string } | null;
    signout: () => void;
  }) => (
    <div>
      <span data-testid="footer-user">{user?.uid ?? "none"}</span>
      <button onClick={signout}>sign-out</button>
    </div>
  ),
}));

vi.mock("../../molecules/ConnectionList", () => ({
  default: ({
    connections,
    onEdit,
    onDelete,
    onOpen,
  }: {
    connections: Connection[];
    onEdit: (connection: Connection) => void;
    onDelete: (connection: Connection) => void;
    onOpen: (connection: Connection) => void;
  }) => (
    <ul>
      {connections.map((connection) => (
        <li key={connection.id} data-testid="connection-item">
          {connection.name}
          <button onClick={() => onOpen(connection)}>
            open-{connection.id}
          </button>
          <button onClick={() => onEdit(connection)}>
            edit-{connection.id}
          </button>
          <button onClick={() => onDelete(connection)}>
            delete-{connection.id}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock("../../organisms/ConnectionDialog", () => ({
  default: ({
    open,
    connection,
    onClose,
    onSubmit,
  }: {
    open: boolean;
    connection: Connection;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
  }) =>
    open ? (
      <div role="dialog">
        <span data-testid="dialog-mode">
          {connection.id ? "edit" : "create"}
        </span>
        <span data-testid="dialog-connection-id">{connection.id}</span>
        <span data-testid="dialog-connection-name">{connection.name}</span>
        <button onClick={() => void onSubmit("Store")}>submit</button>
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}));

type OnConnections = NonNullable<
  Parameters<typeof ConnectionsService.subscribe>[1]
>;
type OnConnectionsError = NonNullable<
  Parameters<typeof ConnectionsService.subscribe>[2]
>;

const subscribeMock = vi.mocked(ConnectionsService.subscribe);
const createMock = vi.mocked(ConnectionsService.create);
const updateMock = vi.mocked(ConnectionsService.update);
const deleteMock = vi.mocked(ConnectionsService.delete);
const signOutMock = vi.mocked(FirebaseService.signOut);
const routeContactsMock = vi.mocked(RouterUtil.generateRouteContacts);

const unsubscribe = vi.fn();

let emitConnections!: OnConnections;
let failConnections!: OnConnectionsError;

const makeConnection = (id: string): Connection => ({
  id,
  name: `Connection ${id}`,
});

const renderTemplate = (user: unknown = { uid: "user-1" }) =>
  render(
    <AuthContext.Provider
      value={{ user, loading: false } as unknown as AuthState}
    >
      <ConnectionsTemplate />
    </AuthContext.Provider>,
  );

const loadConnections = (connections: Connection[]) =>
  act(() => emitConnections(connections));

const newConnectionButton = () =>
  screen.getByRole("button", { name: /nova conexão/i });

describe("ConnectionsTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    subscribeMock.mockImplementation((_uid, onData, onError) => {
      if (onData) emitConnections = onData;
      if (onError) failConnections = onError;
      return unsubscribe;
    });
    createMock.mockResolvedValue(undefined as never);
    updateMock.mockResolvedValue(undefined as never);
    deleteMock.mockResolvedValue(undefined as never);
    routeContactsMock.mockImplementation(
      (id: string) => `/connections/${id}/contacts`,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("subscription", () => {
    it("subscribes with the logged user uid", () => {
      renderTemplate();

      expect(subscribeMock).toHaveBeenCalledWith(
        "user-1",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("does not subscribe when there is no authenticated user", () => {
      renderTemplate(null);

      expect(subscribeMock).not.toHaveBeenCalled();
      expect(screen.queryAllByTestId("connection-item")).toHaveLength(0);
    });

    it("unsubscribes on unmount", () => {
      const { unmount } = renderTemplate();

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("logs the failure when the stream errors", () => {
      renderTemplate();
      const failure = new Error("boom");

      act(() => failConnections(failure));

      expect(console.error).toHaveBeenCalledWith(
        "Failed to load connections:",
        failure,
      );
    });
  });

  describe("listing", () => {
    it("renders the connections from the snapshot and follows later snapshots (realtime)", () => {
      renderTemplate();
      expect(screen.queryAllByTestId("connection-item")).toHaveLength(0);

      loadConnections([makeConnection("c1")]);
      expect(screen.getAllByTestId("connection-item")).toHaveLength(1);

      loadConnections([makeConnection("c1"), makeConnection("c2")]);
      expect(screen.getAllByTestId("connection-item")).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("opens the dialog in create mode with an empty connection", async () => {
      const user = userEvent.setup();
      renderTemplate();

      await user.click(newConnectionButton());

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
      expect(screen.getByTestId("dialog-connection-id")).toBeEmptyDOMElement();
      expect(
        screen.getByTestId("dialog-connection-name"),
      ).toBeEmptyDOMElement();
    });

    it("creates the connection by name and closes the dialog", async () => {
      const user = userEvent.setup();
      renderTemplate();

      await user.click(newConnectionButton());
      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() => expect(createMock).toHaveBeenCalledWith("Store"));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("logs the error and keeps the dialog open when creation fails", async () => {
      const failure = new Error("permission-denied");
      createMock.mockRejectedValue(failure);
      const user = userEvent.setup();
      renderTemplate();

      await user.click(newConnectionButton());
      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() =>
        expect(console.error).toHaveBeenCalledWith(
          "Failed to save connection:",
          failure,
        ),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("edit", () => {
    it("opens the dialog in edit mode with the selected connection and updates it", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadConnections([makeConnection("c1")]);

      await user.click(screen.getByRole("button", { name: "edit-c1" }));

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("edit");
      expect(screen.getByTestId("dialog-connection-id")).toHaveTextContent(
        "c1",
      );
      expect(screen.getByTestId("dialog-connection-name")).toHaveTextContent(
        "Connection c1",
      );

      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() =>
        expect(updateMock).toHaveBeenCalledWith("c1", "Store"),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(createMock).not.toHaveBeenCalled();
    });

    it("opens in create mode after an edit was cancelled", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadConnections([makeConnection("c1")]);

      await user.click(screen.getByRole("button", { name: "edit-c1" }));
      await user.click(screen.getByRole("button", { name: "close" }));
      await user.click(newConnectionButton());

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
    });

    it("logs the error and keeps the dialog open when the update fails", async () => {
      const failure = new Error("permission-denied");
      updateMock.mockRejectedValue(failure);
      const user = userEvent.setup();
      renderTemplate();
      loadConnections([makeConnection("c1")]);

      await user.click(screen.getByRole("button", { name: "edit-c1" }));
      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() =>
        expect(console.error).toHaveBeenCalledWith(
          "Failed to save connection:",
          failure,
        ),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("deletes the connection by id", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadConnections([makeConnection("c1")]);

      await user.click(screen.getByRole("button", { name: "delete-c1" }));

      await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("c1"));
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("navigation and footer", () => {
    it("opens the contacts route of the selected connection", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadConnections([makeConnection("c1")]);

      await user.click(screen.getByRole("button", { name: "open-c1" }));

      expect(routeContactsMock).toHaveBeenCalledWith("c1");
      expect(navigateMock).toHaveBeenCalledWith("/connections/c1/contacts");
    });

    it("passes the logged user to the footer and wires sign out", async () => {
      const user = userEvent.setup();
      renderTemplate();

      expect(screen.getByTestId("footer-user")).toHaveTextContent("user-1");

      await user.click(screen.getByRole("button", { name: "sign-out" }));

      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
  });
});
