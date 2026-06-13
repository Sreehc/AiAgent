import { apiRequest } from "./api";

export type AccountProfile = {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
};

export type AccountApiConfig = {
  baseUrl: string;
  apiKeyMasked: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  configured: boolean;
};

export type AccountApiConfigUpdate = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type AccountApiConfigTestResult = {
  modelType: "CHAT" | "EMBEDDING" | "IMAGE";
  status: string;
  message: string;
};

export type LoginLogEntry = {
  loginIp: string;
  userAgent: string;
  loginResult: string;
  loginAt: string;
};

export type LoginLogResponse = {
  pageNo: number;
  pageSize: number;
  items: LoginLogEntry[];
};

export const accountApi = {
  getProfile: (accessToken: string) => apiRequest<AccountProfile>("/account/profile", {}, accessToken),
  updateProfile: (
    accessToken: string,
    payload: Pick<AccountProfile, "displayName" | "email" | "phone">
  ) => apiRequest<AccountProfile>("/account/profile", { method: "PUT", body: JSON.stringify(payload) }, accessToken),
  changePassword: (accessToken: string, payload: { oldPassword: FormDataEntryValue | null; newPassword: FormDataEntryValue | null }) =>
    apiRequest<void>("/account/change-password", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  listLoginLogs: (accessToken: string, pageNo = 1, pageSize = 5) =>
    apiRequest<LoginLogResponse>(`/account/login-logs?pageNo=${pageNo}&pageSize=${pageSize}`, {}, accessToken),
  getApiConfig: (accessToken: string) => apiRequest<AccountApiConfig>("/account/api-config", {}, accessToken),
  updateApiConfig: (accessToken: string, payload: AccountApiConfigUpdate) =>
    apiRequest<AccountApiConfig>("/account/api-config", { method: "PUT", body: JSON.stringify(payload) }, accessToken),
  testApiConfig: (accessToken: string, modelType: AccountApiConfigTestResult["modelType"]) =>
    apiRequest<AccountApiConfigTestResult>("/account/api-config/test", { method: "POST", body: JSON.stringify({ modelType }) }, accessToken)
};
