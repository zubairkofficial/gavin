import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AuthContext } from ".";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  // const [user, setUser] = useState<IUser | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    // Check for existing tokens in localStorage
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    if (token && userData) {
      try {
        const decodedJWT = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;
        if (decodedJWT.exp < currentTime) {
          console.log("Token expired");
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userData");
          setUser(null);
        }
        setUser(JSON.parse(userData));
      } catch (error) {
        console.log("Error parsing user data", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const onAuth = useCallback(
    (token: string, userData: any, refreshToken?: string) => {
      console.log("onAuth", token, userData, refreshToken);
      localStorage.setItem("authToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        onAuth,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;