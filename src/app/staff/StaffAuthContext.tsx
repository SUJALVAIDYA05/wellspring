"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
}

interface StaffAuthContextType {
  user: StaffUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<StaffUser | null>;
  logout: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<StaffUser | null> => {
    try {
      const res = await fetch("/api/staff/auth/me");
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
        return json.user;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch("/api/staff/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    router.push("/staff/login");
  };

  return (
    <StaffAuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
}
