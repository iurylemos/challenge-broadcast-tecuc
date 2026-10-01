import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseService } from "../../../services/firebase.service";
import { RouterPath } from "../../../interfaces/router.interface";
import LoginTemplate from "./index";

vi.mock("../../../services/firebase.service", () => ({
  FirebaseService: {
    signIn: vi.fn(),
    getAuthErrorMessage: vi.fn(),
  },
}));

type SignInResult = Awaited<ReturnType<typeof FirebaseService.signIn>>;

const signInMock = vi.mocked(FirebaseService.signIn);
const errorMessageMock = vi.mocked(FirebaseService.getAuthErrorMessage);

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginTemplate />
    </MemoryRouter>,
  );

const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) => {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/senha/i), password);
  await user.click(screen.getByRole("button", { name: /login/i }));
};

describe("LoginTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    signInMock.mockResolvedValue({} as SignInResult);
    errorMessageMock.mockReturnValue("Invalid email or password.");
  });

  it("renders the form fields, submit button and signup link", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: /bem-vindo de volta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: /crie uma conta/i }),
    ).toHaveAttribute("href", RouterPath.SIGNUP);
  });

  it("does not submit and flags the fields when the form is empty", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInvalid());
    expect(screen.getByLabelText(/senha/i)).toBeInvalid();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("does not submit when the email is malformed", async () => {
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "not-an-email", "secret123");

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInvalid());
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("calls signIn with the typed credentials", async () => {
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "ana@example.com", "secret123");

    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith("ana@example.com", "secret123"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the mapped error message when signIn fails", async () => {
    const failure = new Error("auth/invalid-credential");
    signInMock.mockRejectedValue(failure);
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "ana@example.com", "wrong-pass");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(errorMessageMock).toHaveBeenCalledWith(failure);
  });

  it("disables the button while submitting and re-enables it afterwards", async () => {
    let finishSignIn!: () => void;
    signInMock.mockReturnValue(
      new Promise<SignInResult>((resolve) => {
        finishSignIn = () => resolve({} as SignInResult);
      }),
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "ana@example.com", "secret123");

    expect(
      await screen.findByRole("button", { name: /carregando/i }),
    ).toBeDisabled();

    finishSignIn();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /login/i })).toBeEnabled(),
    );
  });
});
