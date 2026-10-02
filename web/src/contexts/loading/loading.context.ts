import { createContext } from "react";

export type LoadingContextData = {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const LoadingContext = createContext<LoadingContextData>({
  isLoading: false,
  setIsLoading: () => {},
});
