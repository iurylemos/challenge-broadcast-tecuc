import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
  type Unsubscribe,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../config/firebase.config";

type FirebaseCallbackChange = (user: User | null) => void;

export class FirebaseService {
  private static readonly errorMessages: Record<string, string> = {
    "auth/invalid-credential": "Email ou senha inválidos.",
    "auth/email-already-in-use": "Este email já está em uso.",
    "auth/weak-password": "Senha muito fraca.",
    "auth/invalid-email": "Email inválido.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/network-request-failed": "Falha de rede. Verifique sua conexão.",
  };

  public static async signUp(
    email: string,
    password: string,
  ): Promise<UserCredential> {
    return await createUserWithEmailAndPassword(auth, email, password);
  }

  public static async signIn(
    email: string,
    password: string,
  ): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  public static async signOut(): Promise<void> {
    return await firebaseSignOut(auth);
  }

  public static subscribeAuth(onChange: FirebaseCallbackChange): Unsubscribe {
    return onAuthStateChanged(auth, onChange);
  }

  public static getAuthErrorMessage(error: unknown): string {
    return error instanceof FirebaseError
      ? (this.errorMessages[error.code] ?? "Erro inesperado. Tente novamente.")
      : "Erro inesperado. Tente novamente.";
  }
}
