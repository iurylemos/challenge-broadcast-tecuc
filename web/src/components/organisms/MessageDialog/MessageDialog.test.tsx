import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Contact } from "../../../interfaces/contact.interface";
import type { Message } from "../../../interfaces/message.interface";
import MessageDialog from "./index";

type Props = ComponentProps<typeof MessageDialog>;
type Submit = (
  contactIds: string[],
  content: string,
  scheduledAt?: string,
) => Promise<void>;

const FUTURE = "2099-01-01T10:00";
const PAST = "2000-01-01T10:00";

const CONTACTS: Contact[] = [
  {
    id: "c1",
    connectionId: "conn-1",
    name: "Alice Souza",
    phone: "85911111111",
  },
  {
    id: "c2",
    connectionId: "conn-1",
    name: "Bruno Lima",
    phone: "85922222222",
  },
];

// Cast through unknown so the fixture doesn't depend on every field of your Message interface.
const makeMessage = (overrides: Record<string, unknown> = {}): Message =>
  ({
    id: "m1",
    contactIds: ["c1"],
    message: "Existing text",
    status: "scheduled",
    scheduledAt: FUTURE,
    ...overrides,
  }) as unknown as Message;

const setup = (initial: Partial<Props> = {}) => {
  const onClose = vi.fn();
  const onSubmit = vi.fn<Submit>().mockResolvedValue(undefined);
  const base: Props = {
    open: true,
    contacts: CONTACTS,
    message: null,
    onClose,
    onSubmit,
  };

  const view = render(<MessageDialog {...base} {...initial} />);
  const update = (next: Partial<Props>) =>
    view.rerender(<MessageDialog {...base} {...initial} {...next} />);

  return { user: userEvent.setup(), onClose, onSubmit, update };
};

const contactBox = (name: RegExp) => screen.getByRole("checkbox", { name });
const scheduleBox = () =>
  screen.getByRole("checkbox", { name: /agendar mensagem/i });
const messageField = () => screen.getByLabelText("Mensagem");
const dateField = () => screen.getByLabelText("Data e horário");
const button = (name: RegExp) => screen.getByRole("button", { name });

describe("MessageDialog", () => {
  describe("rendering", () => {
    it("renders nothing when closed", () => {
      setup({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the create mode with every contact unchecked and no date field", () => {
      setup();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Nova mensagem" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Alice Souza")).toBeInTheDocument();
      expect(screen.getByText("85911111111")).toBeInTheDocument();
      expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
      expect(contactBox(/alice/i)).not.toBeChecked();
      expect(contactBox(/bruno/i)).not.toBeChecked();
      expect(messageField()).toHaveValue("");
      expect(scheduleBox()).not.toBeChecked();
      expect(screen.queryByLabelText("Data e horário")).not.toBeInTheDocument();
      expect(button(/enviar agora/i)).toBeEnabled();
    });

    it("renders only the schedule checkbox when there are no contacts", () => {
      setup({ contacts: [] });

      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
      expect(scheduleBox()).toBeInTheDocument();
    });

    it("toggles the date field and the submit label with the schedule checkbox", async () => {
      const { user } = setup();

      await user.click(scheduleBox());

      expect(dateField()).toBeInTheDocument();
      expect(button(/^agendar$/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /enviar agora/i }),
      ).not.toBeInTheDocument();

      await user.click(scheduleBox());

      expect(screen.queryByLabelText("Data e horário")).not.toBeInTheDocument();
      expect(button(/enviar agora/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("does not submit an empty form and flags the message field", async () => {
      const { user, onSubmit } = setup();

      await user.click(button(/enviar agora/i));

      await waitFor(() => expect(messageField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit without at least one contact", async () => {
      const { user, onSubmit } = setup();

      await user.type(messageField(), "Hello");
      await user.click(button(/enviar agora/i));

      await waitFor(() => expect(messageField()).toBeValid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit without message content", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.click(button(/enviar agora/i));

      await waitFor(() => expect(messageField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit a scheduled message without a date", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.type(messageField(), "Hello");
      await user.click(scheduleBox());
      await user.click(button(/^agendar$/i));

      await waitFor(() => expect(dateField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit a scheduled message in the past", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.type(messageField(), "Hello");
      await user.click(scheduleBox());
      fireEvent.change(dateField(), { target: { value: PAST } });
      await user.click(button(/^agendar$/i));

      await waitFor(() => expect(dateField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("sends now with the selected contacts in click order and a trimmed message", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.click(contactBox(/bruno/i));
      await user.type(messageField(), "  Hello world  ");
      await user.click(button(/enviar agora/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          ["c1", "c2"],
          "Hello world",
          undefined,
        ),
      );
    });

    it("removes a contact when its checkbox is unchecked", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.click(contactBox(/bruno/i));
      await user.click(contactBox(/alice/i));
      expect(contactBox(/alice/i)).not.toBeChecked();
      await user.type(messageField(), "Hello");
      await user.click(button(/enviar agora/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(["c2"], "Hello", undefined),
      );
    });

    it("schedules the message forwarding the chosen date", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.type(messageField(), "Later");
      await user.click(scheduleBox());
      fireEvent.change(dateField(), { target: { value: FUTURE } });
      await user.click(button(/^agendar$/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(["c1"], "Later", FUTURE),
      );
    });

    it("ignores a typed date when the schedule checkbox is switched off again", async () => {
      const { user, onSubmit } = setup();

      await user.click(contactBox(/alice/i));
      await user.type(messageField(), "Now");
      await user.click(scheduleBox());
      fireEvent.change(dateField(), { target: { value: FUTURE } });
      await user.click(scheduleBox());
      await user.click(button(/enviar agora/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(["c1"], "Now", undefined),
      );
    });
  });

  describe("edit", () => {
    it("prefills the form from a scheduled message", () => {
      setup({ message: makeMessage() });

      expect(
        screen.getByRole("heading", { name: "Editar mensagem" }),
      ).toBeInTheDocument();
      expect(contactBox(/alice/i)).toBeChecked();
      expect(contactBox(/bruno/i)).not.toBeChecked();
      expect(messageField()).toHaveValue("Existing text");
      expect(scheduleBox()).toBeChecked();
      expect(dateField()).toHaveValue(FUTURE);
      expect(button(/^agendar$/i)).toBeInTheDocument();
    });

    it("submits the edited values keeping the schedule", async () => {
      const { user, onSubmit } = setup({ message: makeMessage() });

      await user.click(contactBox(/bruno/i));
      await user.clear(messageField());
      await user.type(messageField(), "Updated");
      await user.click(button(/^agendar$/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(["c1", "c2"], "Updated", FUTURE),
      );
    });

    it('shows "Salvar alterações" and no date for a message without schedule', async () => {
      const { user, onSubmit } = setup({
        message: makeMessage({ scheduledAt: undefined }),
      });

      expect(scheduleBox()).not.toBeChecked();
      expect(screen.queryByLabelText("Data e horário")).not.toBeInTheDocument();

      await user.clear(messageField());
      await user.type(messageField(), "Updated");
      await user.click(button(/salvar alterações/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(["c1"], "Updated", undefined),
      );
    });

    it("resets the form when the selected message changes to none", async () => {
      const { update } = setup({ message: makeMessage() });
      expect(messageField()).toHaveValue("Existing text");

      update({ message: null });

      await waitFor(() => expect(messageField()).toHaveValue(""));
      expect(contactBox(/alice/i)).not.toBeChecked();
      expect(scheduleBox()).not.toBeChecked();
      expect(
        screen.getByRole("heading", { name: "Nova mensagem" }),
      ).toBeInTheDocument();
    });

    it("loads the new values when another message is selected", async () => {
      const { update } = setup({ message: makeMessage() });

      update({
        message: makeMessage({
          id: "m2",
          contactIds: ["c2"],
          message: "Other text",
          scheduledAt: undefined,
        }),
      });

      await waitFor(() => expect(messageField()).toHaveValue("Other text"));
      expect(contactBox(/bruno/i)).toBeChecked();
      expect(contactBox(/alice/i)).not.toBeChecked();
      expect(scheduleBox()).not.toBeChecked();
    });
  });

  describe("closing and submitting state", () => {
    it("calls onClose from the cancel button without submitting", async () => {
      const { user, onClose, onSubmit } = setup();

      await user.click(button(/cancelar/i));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("calls onClose when Escape is pressed", async () => {
      const { user, onClose } = setup();

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("locks the actions and ignores Escape while submitting", async () => {
      let finishSubmit!: () => void;
      const onSubmit = vi.fn<Submit>().mockReturnValue(
        new Promise<void>((resolve) => {
          finishSubmit = resolve;
        }),
      );
      const { user, onClose } = setup({ onSubmit });

      await user.click(contactBox(/alice/i));
      await user.type(messageField(), "Hello");
      await user.click(button(/enviar agora/i));

      expect(
        await screen.findByRole("button", { name: /salvando/i }),
      ).toBeDisabled();
      expect(button(/cancelar/i)).toBeDisabled();

      await user.keyboard("{Escape}");
      expect(onClose).not.toHaveBeenCalled();

      finishSubmit();

      await waitFor(() => expect(button(/enviar agora/i)).toBeEnabled());
      expect(button(/cancelar/i)).toBeEnabled();
    });
  });
});
