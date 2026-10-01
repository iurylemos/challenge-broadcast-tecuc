import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Contact } from "../../../interfaces/contact.interface";
import ContactDialog from "./index";

type Props = ComponentProps<typeof ContactDialog>;
type Submit = (name: string, phone: string) => Promise<void>;

const NEW_CONTACT: Contact = {
  id: "",
  connectionId: "conn-1",
  name: "",
  phone: "",
};
const EXISTING: Contact = {
  id: "c1",
  connectionId: "conn-1",
  name: "Alice Souza",
  phone: "85911111111",
};

const setup = (initial: Partial<Props> = {}) => {
  const onClose = vi.fn();
  const onSubmit = vi.fn<Submit>().mockResolvedValue(undefined);
  const base: Props = { open: true, contact: NEW_CONTACT, onClose, onSubmit };

  const view = render(<ContactDialog {...base} {...initial} />);
  const update = (next: Partial<Props>) =>
    view.rerender(<ContactDialog {...base} {...initial} {...next} />);

  return { user: userEvent.setup(), onClose, onSubmit, update };
};

const nameField = () => screen.getByLabelText("Nome");
const phoneField = () => screen.getByLabelText("Telefone");
const button = (name: RegExp) => screen.getByRole("button", { name });

describe("ContactDialog", () => {
  describe("rendering", () => {
    it("renders nothing when closed", () => {
      setup({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the create mode with empty fields and focus on the name", async () => {
      setup();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Novo contato" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("");
      expect(phoneField()).toHaveValue("");
      expect(button(/^salvar$/i)).toBeEnabled();
      expect(button(/cancelar/i)).toBeEnabled();
      await waitFor(() => expect(nameField()).toHaveFocus());
    });

    it("renders the edit mode prefilled with the contact data", () => {
      setup({ contact: EXISTING });

      expect(
        screen.getByRole("heading", { name: "Editar contato" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("Alice Souza");
      expect(phoneField()).toHaveValue("85911111111");
      expect(button(/^editar$/i)).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: /^salvar$/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("does not submit an empty form and shows both required messages", async () => {
      const { user, onSubmit } = setup();

      await user.click(button(/^salvar$/i));

      expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Telefone é obrigatório")).toBeInTheDocument();
      expect(nameField()).toBeInvalid();
      expect(phoneField()).toBeInvalid();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("flags only the phone when just the name is filled", async () => {
      const { user, onSubmit } = setup();

      await user.type(nameField(), "Alice");
      await user.click(button(/^salvar$/i));

      expect(
        await screen.findByText("Telefone é obrigatório"),
      ).toBeInTheDocument();
      expect(nameField()).toBeValid();
      expect(phoneField()).toBeInvalid();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("flags only the name when just the phone is filled", async () => {
      const { user, onSubmit } = setup();

      await user.type(phoneField(), "85911111111");
      await user.click(button(/^salvar$/i));

      expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
      expect(phoneField()).toBeValid();
      expect(nameField()).toBeInvalid();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("clears the error as soon as the field is filled after a failed submit", async () => {
      const { user } = setup();

      await user.click(button(/^salvar$/i));
      await waitFor(() => expect(nameField()).toBeInvalid());

      await user.type(nameField(), "Alice");

      await waitFor(() => expect(nameField()).toBeValid());
      expect(screen.queryByText("Nome é obrigatório")).not.toBeInTheDocument();
    });
  });

  describe("submit", () => {
    it("creates with trimmed name and phone", async () => {
      const { user, onSubmit } = setup();

      await user.type(nameField(), "  Alice  ");
      await user.type(phoneField(), " 85911111111 ");
      await user.click(button(/^salvar$/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith("Alice", "85911111111"),
      );
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("submits the edited values in edit mode", async () => {
      const { user, onSubmit } = setup({ contact: EXISTING });

      await user.clear(nameField());
      await user.type(nameField(), "Alice Santos");
      await user.click(button(/^editar$/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith("Alice Santos", "85911111111"),
      );
    });

    it("forwards the phone exactly as typed (no masking or normalization)", async () => {
      const { user, onSubmit } = setup();

      await user.type(nameField(), "Alice");
      await user.type(phoneField(), "(85) 91111-1111");
      await user.click(button(/^salvar$/i));

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith("Alice", "(85) 91111-1111"),
      );
    });
  });

  describe("prefill and reset", () => {
    it("loads the new values when another contact is selected", async () => {
      const { update } = setup({ contact: EXISTING });

      update({
        contact: {
          ...EXISTING,
          id: "c2",
          name: "Bruno Lima",
          phone: "85922222222",
        },
      });

      await waitFor(() => expect(nameField()).toHaveValue("Bruno Lima"));
      expect(phoneField()).toHaveValue("85922222222");
      expect(
        screen.getByRole("heading", { name: "Editar contato" }),
      ).toBeInTheDocument();
    });

    it("switches from edit to create and clears the fields", async () => {
      const { update } = setup({ contact: EXISTING });

      update({ contact: NEW_CONTACT });

      await waitFor(() => expect(nameField()).toHaveValue(""));
      expect(phoneField()).toHaveValue("");
      expect(
        screen.getByRole("heading", { name: "Novo contato" }),
      ).toBeInTheDocument();
      expect(button(/^salvar$/i)).toBeInTheDocument();
    });

    it("discards unsaved typing and previous errors when the dialog is reopened", async () => {
      const { user, update } = setup();

      await user.type(nameField(), "Draft");
      await user.click(button(/^salvar$/i));
      await waitFor(() => expect(phoneField()).toBeInvalid());

      update({ open: false });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      update({ open: true });

      await waitFor(() => expect(nameField()).toHaveValue(""));
      expect(phoneField()).toBeValid();
      expect(
        screen.queryByText("Telefone é obrigatório"),
      ).not.toBeInTheDocument();
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

    it("locks the actions and ignores Escape while creating", async () => {
      let finishSubmit!: () => void;
      const onSubmit = vi.fn<Submit>().mockReturnValue(
        new Promise<void>((resolve) => {
          finishSubmit = resolve;
        }),
      );
      const { user, onClose } = setup({ onSubmit });

      await user.type(nameField(), "Alice");
      await user.type(phoneField(), "85911111111");
      await user.click(button(/^salvar$/i));

      expect(
        await screen.findByRole("button", { name: /salvando/i }),
      ).toBeDisabled();
      expect(button(/cancelar/i)).toBeDisabled();

      await user.keyboard("{Escape}");
      expect(onClose).not.toHaveBeenCalled();

      finishSubmit();

      await waitFor(() => expect(button(/^salvar$/i)).toBeEnabled());
      expect(button(/cancelar/i)).toBeEnabled();
    });

    it('shows "Editando..." while an edit is in flight', async () => {
      let finishSubmit!: () => void;
      const onSubmit = vi.fn<Submit>().mockReturnValue(
        new Promise<void>((resolve) => {
          finishSubmit = resolve;
        }),
      );
      const { user } = setup({ contact: EXISTING, onSubmit });

      await user.click(button(/^editar$/i));

      expect(
        await screen.findByRole("button", { name: /editando/i }),
      ).toBeDisabled();

      finishSubmit();

      await waitFor(() => expect(button(/^editar$/i)).toBeEnabled());
    });
  });
});
