import { useEffect, useState } from "react";
import { AuthSession, clearSession, readSession, writeSession } from "../stores/auth";

export function useAuthSession() {
  const [session, setSessionState] = useState<AuthSession | null>(() => readSession());

  useEffect(() => {
    const onStorage = () => {
      setSessionState(readSession());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setSession(next: AuthSession | null) {
    if (next) {
      const normalized = {
        ...next,
        expiresAt: next.expiresAt ?? Date.now() + next.expiresIn * 1000
      };
      writeSession(normalized);
      setSessionState(normalized);
    } else {
      clearSession();
      setSessionState(null);
    }
  }

  return {
    session,
    setSession
  };
}

