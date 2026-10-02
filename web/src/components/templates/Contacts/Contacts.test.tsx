import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../../contexts/auth/auth.context";
import type { AuthState } from "../../../interfaces/auth.interface";
import type { Contact } from "../../../interfaces/contact.interface";
import { ContactsService } from "../../../services/contacts.service";
import { RouterUtil } from "../../../utils/router.util";
import { LoadingProvider } from "../../../providers/Loading.provider";
import { SnackbarProvider } from "../../../providers/Snackbar.provider";

import ContactsTemplate from "./index";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../../services/contacts.service", () => ({
  ContactsService: {
    subscribe: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../utils/router.util", () => ({
  RouterUtil: {
    generateRouteMessages: vi.fn(),
  },
}));

vi.mock("../../organisms/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("../../atoms/FooterContacts", () => ({
  default: ({ navigate }: { navigate: (path: string) => void }) => (
    <button onClick={() => navigate("/footer-path")}>footer-navigate</button>
  ),
}));

vi.mock("../../molecules/ContactList", () => ({
  default: ({
    contacts,
    onEdit,
    onDelete,
    openMessages,
  }: {
    contacts: Contact[];
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    openMessages: () => void;
  }) => (
    <div>
      <ul>
        {contacts.map((contact) => (
          <li key={contact.id} data-testid="contact-item">
            {contact.name}

            <button onClick={() => onEdit(contact)}>edit-{contact.id}</button>

            <button onClick={() => onDelete(contact)}>
              delete-{contact.id}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={openMessages}>open-messages</button>
    </div>
  ),
}));

vi.mock("../../organisms/ContactDialog", () => ({
  default: ({
    open,
    contact,
    onClose,
    onSubmit,
  }: {
    open: boolean;
    contact: Contact;
    onClose: () => void;
    onSubmit: (name: string, phone: string) => Promise<void>;
  }) =>
    open ? (
      <div role="dialog">
        <span data-testid="dialog-mode">{contact.id ? "edit" : "create"}</span>

        <span data-testid="dialog-contact-id">{contact.id}</span>

        <span data-testid="dialog-connection-id">{contact.connectionId}</span>

        <button onClick={() => void onSubmit("Ana", "85987654321")}>
          submit
        </button>

        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}));

type OnContacts = NonNullable<Parameters<typeof ContactsService.subscribe>[2]>;

type OnContactsError = NonNullable<
  Parameters<typeof ContactsService.subscribe>[3]
>;

const subscribeMock = vi.mocked(ContactsService.subscribe);
const createMock = vi.mocked(ContactsService.create);
const updateMock = vi.mocked(ContactsService.update);
const deleteMock = vi.mocked(ContactsService.delete);

const routeMessagesMock = vi.mocked(RouterUtil.generateRouteMessages);

const unsubscribe = vi.fn();

let emitContacts!: OnContacts;
let failContacts!: OnContactsError;

const makeContact = (id: string): Contact => ({
  id,
  connectionId: "conn-1",
  name: `Contact ${id}`,
  phone: "85987654321",
});

const renderTemplate = (
  user: unknown = { uid: "user-1" },
  route = "/connections/conn-1/contacts",
  path = "/connections/:connectionId/contacts",
) =>
  render(
    <LoadingProvider>
      <SnackbarProvider>
        <AuthContext.Provider
          value={
            {
              user,
              loading: false,
            } as unknown as AuthState
          }
        >
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={<ContactsTemplate />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </SnackbarProvider>
    </LoadingProvider>,
  );

const loadContacts = (contacts: Contact[]): void => {
  act(() => {
    emitContacts(contacts);
  });
};

const newContactButton = () =>
  screen.getByRole("button", {
    name: /novo contato/i,
  });

describe("ContactsTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.spyOn(console, "error").mockImplementation(() => {});

    subscribeMock.mockImplementation((_uid, _connectionId, onData, onError) => {
      if (onData) {
        emitContacts = onData;
      }

      if (onError) {
        failContacts = onError;
      }

      return unsubscribe;
    });

    createMock.mockResolvedValue(undefined as never);
    updateMock.mockResolvedValue(undefined as never);
    deleteMock.mockResolvedValue(undefined as never);

    routeMessagesMock.mockImplementation(
      (id: string) => `/connections/${id}/messages`,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("subscription", () => {
    it("subscribes with the logged user uid and the connection id from the route", () => {
      renderTemplate();

      expect(subscribeMock).toHaveBeenCalledWith(
        "user-1",
        "conn-1",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("does not subscribe when there is no authenticated user", () => {
      renderTemplate(null);

      expect(subscribeMock).not.toHaveBeenCalled();
    });

    it("unsubscribes on unmount", () => {
      const { unmount } = renderTemplate();

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("renders only the not-found alert when the route has no connection id", () => {
      renderTemplate({ uid: "user-1" }, "/contacts", "/contacts");

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Conexão não encontrada.",
      );

      expect(subscribeMock).not.toHaveBeenCalled();

      expect(
        screen.queryByRole("button", {
          name: /novo contato/i,
        }),
      ).not.toBeInTheDocument();
    });

    it("shows an error and stops the spinner when the stream fails", async () => {
      renderTemplate();

      act(() => {
        failContacts(new Error("boom"));
      });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível carregar os contatos.",
      );

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  describe("loading and listing", () => {
    it("updates the list on later snapshots (realtime)", () => {
      renderTemplate();

      loadContacts([makeContact("c1")]);

      loadContacts([makeContact("c1"), makeContact("c2")]);

      expect(screen.getAllByTestId("contact-item")).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("opens the dialog in create mode bound to the current connection", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([]);

      await user.click(newContactButton());

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");

      expect(screen.getByTestId("dialog-contact-id")).toBeEmptyDOMElement();

      expect(screen.getByTestId("dialog-connection-id")).toHaveTextContent(
        "conn-1",
      );
    });

    it("creates the contact and closes the dialog", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([]);

      await user.click(newContactButton());

      await user.click(
        screen.getByRole("button", {
          name: "submit",
        }),
      );

      await waitFor(() =>
        expect(createMock).toHaveBeenCalledWith("conn-1", "Ana", "85987654321"),
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );

      expect(updateMock).not.toHaveBeenCalled();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Contato criado com sucesso!",
      );
    });

    it("shows an error and keeps the dialog open when creation fails", async () => {
      createMock.mockRejectedValue(new Error("permission-denied"));

      const user = userEvent.setup();

      renderTemplate();

      loadContacts([]);

      await user.click(newContactButton());

      await user.click(
        screen.getByRole("button", {
          name: "submit",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível criar o contato.",
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("edit", () => {
    it("opens in edit mode with the selected contact and updates it", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "edit-c1",
        }),
      );

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("edit");

      expect(screen.getByTestId("dialog-contact-id")).toHaveTextContent("c1");

      await user.click(
        screen.getByRole("button", {
          name: "submit",
        }),
      );

      await waitFor(() =>
        expect(updateMock).toHaveBeenCalledWith("c1", "Ana", "85987654321"),
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );

      expect(createMock).not.toHaveBeenCalled();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Contato atualizado com sucesso!",
      );
    });

    it("opens in create mode after editing was cancelled", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "edit-c1",
        }),
      );

      await user.click(
        screen.getByRole("button", {
          name: "close",
        }),
      );

      await user.click(newContactButton());

      expect(screen.getByTestId("dialog-mode")).toHaveTextContent("create");
    });

    it("shows an error when the update fails", async () => {
      updateMock.mockRejectedValue(new Error("permission-denied"));

      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "edit-c1",
        }),
      );

      await user.click(
        screen.getByRole("button", {
          name: "submit",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível atualizar o contato.",
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("deletes the contact by id", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "delete-c1",
        }),
      );

      await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("c1"));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Contato deletado com sucesso!",
      );
    });

    it("shows an error when the deletion fails", async () => {
      deleteMock.mockRejectedValue(new Error("permission-denied"));

      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "delete-c1",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "permission-denied",
      );
    });
  });

  describe("navigation", () => {
    it("navigates to the messages route of the current connection", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([makeContact("c1")]);

      await user.click(
        screen.getByRole("button", {
          name: "open-messages",
        }),
      );

      expect(routeMessagesMock).toHaveBeenCalledWith("conn-1");

      expect(navigateMock).toHaveBeenCalledWith("/connections/conn-1/messages");
    });

    it("forwards the footer navigation to the router", async () => {
      const user = userEvent.setup();

      renderTemplate();

      loadContacts([]);

      await user.click(
        screen.getByRole("button", {
          name: "footer-navigate",
        }),
      );

      expect(navigateMock).toHaveBeenCalledWith("/footer-path");
    });
  });
});
