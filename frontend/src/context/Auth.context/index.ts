import { createContext, useContext } from "react";

export interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  onAuth: (token: string, userData: any, refreshToken?: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  onAuth: () => { },
  logout: () => { },
  loading: true,
});


export function useAuth() {
  if (!AuthContext) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return useContext(AuthContext);
}