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
      writeSession(next);
    } else {
      clearSession();
    }
    setSessionState(next);
  }

  return {
    session,
    setSession
  };
}

