import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";

const AuthContext = createContext(null);
const TOKEN_KEY = "localon_access_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(mode, payload) {
    const response = mode === "signup" ? await authApi.signup(payload) : await authApi.login(payload);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    setUser(response.user);
    return response.user;
  }

  async function signOut() {
    try { await authApi.logout(); } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }

  async function updateProfile(payload) {
    const updatedUser = await authApi.updateMe(payload);
    setUser(updatedUser);
    return updatedUser;
  }

  const value = useMemo(() => ({ user, loading, authenticate, signOut, updateProfile }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
