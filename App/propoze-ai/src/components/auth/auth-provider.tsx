"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

function AuthSync() {
  const { data: session, status } = useSession();
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setSession(session);
      setLoading(false);
    }
  }, [session, status, setSession, setLoading]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
