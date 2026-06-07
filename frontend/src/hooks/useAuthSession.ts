import { useEffect, useState } from "react";
import { AuthSession, clearSession, readSession, writeSession } from "../stores/auth";

const SESSION_CHANGE_EVENT = "aiagent.auth.sessionchange";

export function useAuthSession() {
  const [session, setSessionState] = useState<AuthSession | null>(() => readSession());

  useEffect(() => {
    const syncSession = () => {
      setSessionState(readSession());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener(SESSION_CHANGE_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(SESSION_CHANGE_EVENT, syncSession);
    };
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
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }

  return {
    session,
    setSession
  };
}
