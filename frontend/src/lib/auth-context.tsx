"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserSession,
  loginUser,
  registerCustomer as apiRegisterCustomer,
  registerWorker as apiRegisterWorker,
  registerContractor as apiRegisterContractor,
  logoutUser,
  fetchCurrentUser,
} from "./api";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (credentials: { identifier: string; password: string; role?: string }) => Promise<UserSession>;
  registerCustomer: (data: any) => Promise<UserSession>;
  registerWorker: (data: any) => Promise<UserSession>;
  registerContractor: (data: any) => Promise<UserSession>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSession | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const router = useRouter();

  const refreshUser = React.useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { identifier: string; password: string; role?: string }) => {
    const res = await loginUser(credentials);
    setUser(res.user);
    return res.user;
  };

  const registerCustomer = async (data: any) => {
    const res = await apiRegisterCustomer(data);
    setUser(res.user);
    return res.user;
  };

  const registerWorker = async (data: any) => {
    const res = await apiRegisterWorker(data);
    setUser(res.user);
    return res.user;
  };

  const registerContractor = async (data: any) => {
    const res = await apiRegisterContractor(data);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerCustomer,
        registerWorker,
        registerContractor,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

