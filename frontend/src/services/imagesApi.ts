import { apiRequest, ImageGenerationItem, ImageHistoryResponse, SessionListResponse } from "./api";

export const imagesApi = {
  listSessions: (accessToken: string) =>
    apiRequest<SessionListResponse>("/sessions?pageNo=1&pageSize=50", {}, accessToken),
  listHistory: (accessToken: string, pageNo = 1, pageSize = 12) =>
    apiRequest<ImageHistoryResponse>(`/images/history?pageNo=${pageNo}&pageSize=${pageSize}`, {}, accessToken),
  generate: (accessToken: string, payload: { prompt: string; size: string; sessionId: string | null }) =>
    apiRequest<ImageGenerationItem>(
      "/images/generations",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken
    ),
  edit: (accessToken: string, body: FormData) =>
    apiRequest<ImageGenerationItem>("/images/edits", { method: "POST", body }, accessToken)
};
