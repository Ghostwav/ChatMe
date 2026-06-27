import { createContext, useContext, ReactNode, useEffect } from "react";
import { User } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user = null, isLoading, isError } = useGetMe({
    query: { retry: false } as any
  });

  useEffect(() => {
    if (!isLoading) {
      if (isError || !user) {
        if (location !== "/login") {
          setLocation("/login");
        }
      } else {
        if (location === "/login") {
          setLocation("/");
        }
      }
    }
  }, [user, isLoading, isError, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
