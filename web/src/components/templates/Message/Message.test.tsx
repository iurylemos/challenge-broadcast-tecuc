import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../../contexts/auth/auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import type {
  Message,
  MessageFilter,
} from "../../../interfaces/message.interface";
import { ContactsService } from "../../../services/contacts.service";
import { MessagesService } from "../../../services/messages.service";
import MessageTemplate from "./index";

vi.mock("../../../services/contacts.service", () => ({
  ContactsService: { subscribe: vi.fn() },
}));

vi.mock("../../../services/messages.service", () => ({
  MessagesService: {
    subscribe: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../organisms/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("../../atoms/FooterMessage", () => ({
  default: ({ connectionId }: { connectionId?: string }) => (
    <div data-testid="footer">{connectionId}</div>
  ),
}));

// Adjust the option values to your MessageFilter union.
vi.mock("../../atoms/Tabs", () => ({
  default: ({
    currentFilter,
    setFilter,
  }: {
    currentFilter: MessageFilter;
    setFilter: (filter: MessageFilter) => void;
  }) => (
    <div>
      <span data-testid="current-filter">{currentFilter}</span>
      {["all", "scheduled", "sent"].map((value) => (
        <button key={value} onClick={() => setFilter(value as MessageFilter)}>
          filter-{value}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../molecules/MessageList", () => ({
  default: ({
    messages,
    onEdit,
    onDelete,
  }: {
    messages: Message[];
    onEdit: (message: Message) => void;
    onDelete: (message: Message) => void;
  }) => (
    <ul>
      {messages.map((message) => (
        <li key={message.id} data-testid="message-item">
          {message.id}
          <button onClick={() => onEdit(message)}>edit-{message.id}</button>
          <button onClick={() => onDelete(message)}>delete-{message.id}</button>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock("../../organisms/MessageDialog", () => ({
  default: ({
    open,
    contacts,
    message,
    onClose,
    onSubmit,
  }: {
    open: boolean;
    contacts: Contact[];
    message: Message | null;
    onClose: () => void;
    onSubmit: (
      contactIds: string[],
      content: string,
      scheduledAt?: string,
    ) => Promise<void>;
  }) =>
    open ? (
      <div role="dialog">
        <span data-testid="dialog-mode">{message ? "edit" : "create"}</span>
        <span data-testid="dialog-contacts">{contacts.length}</span>
        <button onClick={() => void onSubmit(["c1"], "Hello")}>
          submit-now
        </button>
        <button
          onClick={() =>
            void onSubmit(["c1", "c2"], "Later", "2030-01-01T10:00")
          }
        >
          submit-scheduled
        </button>
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}));

type OnContacts = Parameters<typeof ContactsService.subscribe>[2];
type OnMessages = Parameters<typeof MessagesService.subscribe>[2];

const contactsSubscribe = vi.mocked(ContactsService.subscribe);
const messagesSubscribe = vi.mocked(MessagesService.subscribe);
const createMock = vi.mocked(MessagesService.create);
const updateMock = vi.mocked(MessagesService.update);
const deleteMock = vi.mocked(MessagesService.delete);

const unsubscribeContacts = vi.fn();
const unsubscribeMessages = vi.fn();

let emitContacts!: OnContacts;
let emitMessages!: OnMessages;

// Cast through unknown so the fixtures don't depend on the exact shape of your interfaces.
const makeContact = (id: string): Contact =>
  ({ id, name: `Contact ${id}`, phone: "85987654321" }) as unknown as Contact;

const makeMessage = (id: string, status: string): Message =>
  ({
    id,
    status,
    message: `Text ${id}`,
    contactIds: ["c1"],
  }) as unknown as Message;

const renderTemplate = (user: unknown = { uid: "user-1" }) =>
  render(
    <AuthContext.Provider
      value={{ user, loading: false } as unknown as AuthState}
    >
      <MemoryRouter initialEntries={["/connections/conn-1/messages"]}>
        <Routes>
          <Route
            path="/connections/:connectionId/messages"
            element={<MessageTemplate />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const loadData = (contacts: Contact[], messages: Message[]) =>
  act(() => {
    emitContacts(contacts);
    emitMessages(messages);
  });

const newMessageButton = () =>
  screen.getByRole("button", { name: /nova mensagem/i });

describe("MessageTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    contactsSubscribe.mockImplementation((_uid, _connectionId, onData) => {
      emitContacts = onData;
      return unsubscribeContacts;
    });
    messagesSubscribe.mockImplementation((_uid, _connectionId, onData) => {
      emitMessages = onData;
      return unsubscribeMessages;
    });

    createMock.mockResolvedValue(undefined as never);
    updateMock.mockResolvedValue(undefined as never);
    deleteMock.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("subscriptions", () => {
    it("subscribes with the logged user uid and the connection id from the route", () => {
      renderTemplate();

      expect(contactsSubscribe).toHaveBeenCalledWith(
        "user-1",
        "conn-1",
        expect.any(Function),
        expect.any(Function),
      );
      expect(messagesSubscribe).toHaveBeenCalledWith(
        "user-1",
        "conn-1",
        expect.any(Function),
        expect.any(Function),
      );
      expect(screen.getByTestId("footer")).toHaveTextContent("conn-1");
    });

    it("does not subscribe when there is no authenticated user", () => {
      renderTemplate(null);

      expect(contactsSubscribe).not.toHaveBeenCalled();
      expect(messagesSubscribe).not.toHaveBeenCalled();
    });

    it("unsubscribes from both streams on unmount", () => {
      const { unmount } = renderTemplate();

      unmount();

      expect(unsubscribeContacts).toHaveBeenCalledTimes(1);
      expect(unsubscribeMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading and listing", () => {
    it("lists every message by default and filters by status through the tabs", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData(
        [makeContact("c1")],
        [
          makeMessage("m1", "scheduled"),
          makeMessage("m2", "sent"),
          makeMessage("m3", "scheduled"),
        ],
      );

      expect(screen.getByTestId("current-filter")).toHaveTextContent("all");
      expect(screen.getAllByTestId("message-item")).toHaveLength(3);

      await user.click(
        screen.getByRole("button", { name: "filter-scheduled" }),
      );
      expect(
        screen.getAllByTestId("message-item").map((el) => el.textContent),
      ).toEqual([expect.stringContaining("m1"), expect.stringContaining("m3")]);

      await user.click(screen.getByRole("button", { name: "filter-sent" }));
      expect(screen.getAllByTestId("message-item")).toHaveLength(1);
      expect(screen.getByTestId("message-item")).toHaveTextContent("m2");

      await user.click(screen.getByRole("button", { name: "filter-all" }));
      expect(screen.getAllByTestId("message-item")).toHaveLength(3);
    });

    it('keeps "Nova mensagem" disabled until there is at least one contact', () => {
      renderTemplate();
      loadData([], []);

      expect(newMessageButton()).toBeDisabled();

      act(() => emitContacts([makeContact("c1")]));

      expect(newMessageButton()).toBeEnabled();
    });
  });

  describe("create", () => {
    it("opens the dialog in create mode with the available contacts", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1"), makeContact("c2")], []);

      await user.click(newMessageButton());

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
      expect(screen.getByTestId("dialog-contacts")).toHaveTextContent("2");
    });

    it("creates an immediate message and closes the dialog", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], []);

      await user.click(newMessageButton());
      await user.click(screen.getByRole("button", { name: "submit-now" }));

      await waitFor(() =>
        expect(createMock).toHaveBeenCalledWith({
          connectionId: "conn-1",
          contactIds: ["c1"],
          message: "Hello",
          scheduledAt: undefined,
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("creates a scheduled message forwarding scheduledAt", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1"), makeContact("c2")], []);

      await user.click(newMessageButton());
      await user.click(
        screen.getByRole("button", { name: "submit-scheduled" }),
      );

      await waitFor(() =>
        expect(createMock).toHaveBeenCalledWith({
          connectionId: "conn-1",
          contactIds: ["c1", "c2"],
          message: "Later",
          scheduledAt: "2030-01-01T10:00",
        }),
      );
    });

    it("shows an error and keeps the dialog open when creation fails", async () => {
      createMock.mockRejectedValue(new Error("permission-denied"));
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], []);

      await user.click(newMessageButton());
      await user.click(screen.getByRole("button", { name: "submit-now" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível criar a mensagem",
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("edit", () => {
    it("opens the dialog in edit mode and updates the selected message", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], [makeMessage("m1", "scheduled")]);

      await user.click(screen.getByRole("button", { name: "edit-m1" }));
      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("edit");

      await user.click(screen.getByRole("button", { name: "submit-now" }));

      await waitFor(() =>
        expect(updateMock).toHaveBeenCalledWith({
          id: "m1",
          contactIds: ["c1"],
          message: "Hello",
          scheduledAt: undefined,
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(createMock).not.toHaveBeenCalled();
    });

    it("resets the selection on close so the next dialog opens in create mode", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], [makeMessage("m1", "scheduled")]);

      await user.click(screen.getByRole("button", { name: "edit-m1" }));
      await user.click(screen.getByRole("button", { name: "close" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(newMessageButton());

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
    });

    it("shows an error when the update fails", async () => {
      updateMock.mockRejectedValue(new Error("permission-denied"));
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], [makeMessage("m1", "scheduled")]);

      await user.click(screen.getByRole("button", { name: "edit-m1" }));
      await user.click(screen.getByRole("button", { name: "submit-now" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível atualizar a mensagem",
      );
    });
  });

  describe("delete", () => {
    it("deletes the message by id", async () => {
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], [makeMessage("m1", "scheduled")]);

      await user.click(screen.getByRole("button", { name: "delete-m1" }));

      await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("m1"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error when the deletion fails", async () => {
      deleteMock.mockRejectedValue(new Error("permission-denied"));
      const user = userEvent.setup();
      renderTemplate();
      loadData([makeContact("c1")], [makeMessage("m1", "scheduled")]);

      await user.click(screen.getByRole("button", { name: "delete-m1" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível deletar a mensagem",
      );
    });
  });
});
