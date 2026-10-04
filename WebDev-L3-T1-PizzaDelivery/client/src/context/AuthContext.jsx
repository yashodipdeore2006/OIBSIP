import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);

      connectSocket();
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      disconnectSocket();

      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    localStorage.setItem(
      "token",
      response.data.token
    );

    setUser(response.data.user);

    connectSocket();

    return response.data;
  };

  const logout = () => {
    disconnectSocket();

    localStorage.removeItem("token");

    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}