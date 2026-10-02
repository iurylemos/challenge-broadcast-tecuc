import { useState, type JSX, type ReactNode } from "react";
import { LoadingContext } from "../contexts/loading/loading.context";
import Loading from "../components/atoms/Loading";

type LoadingProviderProps = {
  children: ReactNode;
};

export function LoadingProvider({
  children,
}: Readonly<LoadingProviderProps>): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
}
