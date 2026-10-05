import { useState, useCallback, useEffect } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, useCurrentUser, type User } from "@/lib/barber-store";

export function useAuth() {
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await apiLogin(email, password);
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (input: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await apiRegister(input);
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(() => {
    // Force a re-read from localStorage by triggering a custom event
    window.dispatchEvent(new Event('barberia-user-update'));
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
