import { apiRequest, ArtifactItem } from "./api";

export const artifactsApi = {
  list: (accessToken: string, artifactType?: string) =>
    apiRequest<ArtifactItem[]>(`/artifacts${artifactType ? `?artifactType=${encodeURIComponent(artifactType)}` : ""}`, {}, accessToken),
  get: (accessToken: string, artifactId: string) =>
    apiRequest<ArtifactItem>(`/artifacts/${artifactId}`, {}, accessToken),
  upload: (accessToken: string, body: FormData, sessionId?: string) =>
    apiRequest<ArtifactItem>(`/artifacts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`, { method: "POST", body }, accessToken),
  reuse: (accessToken: string, artifactId: string) =>
    apiRequest<{ artifactId: string; artifactType: string; title: string; content: string }>(`/artifacts/${artifactId}/reuse`, { method: "POST" }, accessToken),
  download: (accessToken: string, artifactId: string) =>
    apiRequest<{ url: string }>(`/artifacts/${artifactId}/download`, {}, accessToken)
};
