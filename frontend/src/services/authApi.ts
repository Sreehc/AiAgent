import { apiRequest } from "./api";

export type AuthUser = {
  userId: string;
  username: string;
  displayName: string;
  roles: string[];
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiRequest<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  logout: (accessToken: string) =>
    apiRequest<void>("/auth/logout", { method: "POST" }, accessToken),
  registerByInvite: (payload: Record<string, string>) =>
    apiRequest<void>("/auth/register-by-invite", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (usernameOrEmail: string) =>
    apiRequest<void>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ usernameOrEmail }) }),
  resetPassword: (payload: { resetToken: string; newPassword: string; confirmPassword: string }) =>
    apiRequest<void>("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) })
};
