export type AuthUser = {
  userId: string;
  username: string;
  displayName: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

const STORAGE_KEY = "aiagent.auth.session";

export function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

