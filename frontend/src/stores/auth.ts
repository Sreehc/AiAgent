export type AuthUser = {
  userId: string;
  username: string;
  displayName: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  expiresIn: number;
  expiresAt?: number;
  user: AuthUser;
};

const STORAGE_KEY = "aiagent.auth.session";

export function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: AuthSession) {
  const expiresAt = session.expiresAt ?? Date.now() + session.expiresIn * 1000;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, expiresAt }));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

