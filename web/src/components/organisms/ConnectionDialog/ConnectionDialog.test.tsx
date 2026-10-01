import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Connection } from "../../../interfaces/connection.interface";
import ConnectionDialog from "./index";

type Props = ComponentProps<typeof ConnectionDialog>;

const NEW_CONNECTION: Connection = { id: "", name: "" };
const EXISTING: Connection = { id: "conn-1", name: "Loja Centro" };

const setup = (initial: Partial<Props> = {}) => {
  const onClose = vi.fn();
  const onSubmit = vi.fn<(name: string) => void>();
  const base: Props = {
    open: true,
    connection: NEW_CONNECTION,
    onClose,
    onSubmit,
  };

  const view = render(<ConnectionDialog {...base} {...initial} />);
  const update = (next: Partial<Props>) =>
    view.rerender(<ConnectionDialog {...base} {...initial} {...next} />);

  return { user: userEvent.setup(), onClose, onSubmit, update };
};

const nameField = () => screen.getByLabelText("Nome da conexão");
const button = (name: RegExp) => screen.getByRole("button", { name });

describe("ConnectionDialog", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders nothing when closed", () => {
      setup({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the create mode with an empty field and focus on it", async () => {
      setup();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Criar conexão" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("");
      expect(button(/^criar$/i)).toBeEnabled();
      expect(button(/cancelar/i)).toBeEnabled();
      await waitFor(() => expect(nameField()).toHaveFocus());
    });

    it("renders the edit mode prefilled with the connection name", () => {
      setup({ connection: EXISTING });

      expect(
        screen.getByRole("heading", { name: "Editar conexão" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("Loja Centro");
      expect(button(/^salvar$/i)).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: /^criar$/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("does not submit an empty form and flags the name field", async () => {
      const { user, onSubmit } = setup();

      await user.click(button(/^criar$/i));

      await waitFor(() => expect(nameField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit when the prefilled name is cleared in edit mode", async () => {
      const { user, onSubmit } = setup({ connection: EXISTING });

      await user.clear(nameField());
      await user.click(button(/^salvar$/i));

      await waitFor(() => expect(nameField()).toBeInvalid());
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("clears the error as soon as a valid name is typed after a failed submit", async () => {
      const { user } = setup();

      await user.click(button(/^criar$/i));
      await waitFor(() => expect(nameField()).toBeInvalid());

      await user.type(nameField(), "Loja Norte");

      await waitFor(() => expect(nameField()).toBeValid());
    });
  });

  describe("submit", () => {
    it("creates with the typed name", async () => {
      const { user, onSubmit } = setup();

      await user.type(nameField(), "Loja Norte");
      await user.click(button(/^criar$/i));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Loja Norte"));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("submits the edited name in edit mode", async () => {
      const { user, onSubmit } = setup({ connection: EXISTING });

      await user.clear(nameField());
      await user.type(nameField(), "Loja Sul");
      await user.click(button(/^salvar$/i));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Loja Sul"));
    });

    it("submits with the Enter key", async () => {
      const { user, onSubmit } = setup();

      await user.type(nameField(), "Loja Norte{Enter}");

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Loja Norte"));
    });
  });

  describe("prefill and reset", () => {
    it("loads the new name when another connection is selected", async () => {
      const { update } = setup({ connection: EXISTING });

      update({ connection: { id: "conn-2", name: "Loja Leste" } });

      await waitFor(() => expect(nameField()).toHaveValue("Loja Leste"));
      expect(
        screen.getByRole("heading", { name: "Editar conexão" }),
      ).toBeInTheDocument();
    });

    it("switches from edit to create and clears the field", async () => {
      const { update } = setup({ connection: EXISTING });

      update({ connection: NEW_CONNECTION });

      await waitFor(() => expect(nameField()).toHaveValue(""));
      expect(
        screen.getByRole("heading", { name: "Criar conexão" }),
      ).toBeInTheDocument();
      expect(button(/^criar$/i)).toBeInTheDocument();
    });

    it("discards unsaved typing and errors when the dialog is reopened", async () => {
      const { user, update } = setup({ connection: EXISTING });

      await user.clear(nameField());
      await user.click(button(/^salvar$/i));
      await waitFor(() => expect(nameField()).toBeInvalid());

      update({ open: false });
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      update({ open: true });

      await waitFor(() => expect(nameField()).toHaveValue("Loja Centro"));
      expect(nameField()).toBeValid();
    });
  });

  describe("closing", () => {
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

    it("clears the field on cancel while the dialog is still mounted", async () => {
      const { user, onClose } = setup({ connection: EXISTING });

      await user.click(button(/cancelar/i));

      expect(onClose).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(nameField()).toHaveValue(""));
    });
  });
});
