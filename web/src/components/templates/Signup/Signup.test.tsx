import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseService } from "../../../services/firebase.service";
import { RouterPath } from "../../../interfaces/router.interface";
import { renderWithRouter } from "../../../tests/utils";
import { SignupTemplate } from "./index";

vi.mock("../../../services/firebase.service", () => ({
  FirebaseService: {
    signUp: vi.fn(),
    getAuthErrorMessage: vi.fn(),
  },
}));

type SignUpResult = Awaited<ReturnType<typeof FirebaseService.signUp>>;

const signUpMock = vi.mocked(FirebaseService.signUp);
const errorMessageMock = vi.mocked(FirebaseService.getAuthErrorMessage);

type User = ReturnType<typeof userEvent.setup>;

// Exact strings on purpose: /senha/i would match both "Senha" and "Confirmar senha".
const emailField = () => screen.getByLabelText("Email");
const passwordField = () => screen.getByLabelText("Senha");
const confirmField = () => screen.getByLabelText("Confirmar senha");
const submitButton = () => screen.getByRole("button", { name: /criar conta/i });

const fillAndSubmit = async (
  user: User,
  {
    email,
    password,
    confirmPassword,
  }: { email: string; password: string; confirmPassword: string },
) => {
  await user.type(emailField(), email);
  await user.type(passwordField(), password);
  await user.type(confirmField(), confirmPassword);
  await user.click(submitButton());
};

const VALID = {
  email: "ana@example.com",
  password: "secret123",
  confirmPassword: "secret123",
};

describe("SignupTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    signUpMock.mockResolvedValue({} as SignUpResult);
    errorMessageMock.mockReturnValue("This email is already in use.");
  });

  it("renders the form fields, submit button and login link", () => {
    renderWithRouter(<SignupTemplate />);

    expect(
      screen.getByRole("heading", { name: /crie sua conta/i }),
    ).toBeInTheDocument();
    expect(emailField()).toBeInTheDocument();
    expect(passwordField()).toBeInTheDocument();
    expect(confirmField()).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
    expect(screen.getByRole("link", { name: /fazer login/i })).toHaveAttribute(
      "href",
      RouterPath.LOGIN,
    );
  });

  it("does not submit and flags the fields when the form is empty", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await user.click(submitButton());

    await waitFor(() => expect(emailField()).toBeInvalid());
    expect(passwordField()).toBeInvalid();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("does not submit when the passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await fillAndSubmit(user, { ...VALID, confirmPassword: "different123" });

    await waitFor(() => expect(confirmField()).toBeInvalid());
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("calls signUp with email and password only", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await fillAndSubmit(user, VALID);

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith("ana@example.com", "secret123"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the mapped error message when signUp fails", async () => {
    const failure = new Error("auth/email-already-in-use");
    signUpMock.mockRejectedValue(failure);
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await fillAndSubmit(user, VALID);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This email is already in use.",
    );
    expect(errorMessageMock).toHaveBeenCalledWith(failure);
  });

  it("clears the previous server error on a new attempt", async () => {
    signUpMock.mockRejectedValueOnce(new Error("auth/network-request-failed"));
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await fillAndSubmit(user, VALID);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(submitButton());

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(signUpMock).toHaveBeenCalledTimes(2);
  });

  it("disables the button while submitting and re-enables it afterwards", async () => {
    let finishSignUp!: () => void;
    signUpMock.mockReturnValue(
      new Promise<SignUpResult>((resolve) => {
        finishSignUp = () => resolve({} as SignUpResult);
      }),
    );
    const user = userEvent.setup();
    renderWithRouter(<SignupTemplate />);

    await fillAndSubmit(user, VALID);

    expect(
      await screen.findByRole("button", { name: /criando conta/i }),
    ).toBeDisabled();

    finishSignUp();

    await waitFor(() => expect(submitButton()).toBeEnabled());
  });
});
