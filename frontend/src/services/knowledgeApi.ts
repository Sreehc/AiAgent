import { apiRequest, KnowledgeBaseItem, KnowledgeDocumentItem, SearchHit } from "./api";

export type KnowledgeBasePayload = {
  name: string;
  description: string;
};

export const knowledgeApi = {
  list: (accessToken: string) => apiRequest<KnowledgeBaseItem[]>("/knowledge-bases", {}, accessToken),
  create: (accessToken: string, payload: KnowledgeBasePayload) =>
    apiRequest<KnowledgeBaseItem>("/knowledge-bases", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  update: (accessToken: string, kbId: string, payload: KnowledgeBasePayload) =>
    apiRequest<KnowledgeBaseItem>(`/knowledge-bases/${kbId}`, { method: "PUT", body: JSON.stringify(payload) }, accessToken),
  remove: (accessToken: string, kbId: string) =>
    apiRequest<void>(`/knowledge-bases/${kbId}`, { method: "DELETE" }, accessToken),
  listDocuments: (accessToken: string, kbId: string) =>
    apiRequest<KnowledgeDocumentItem[]>(`/knowledge-bases/${kbId}/documents`, {}, accessToken),
  uploadDocument: (accessToken: string, kbId: string, body: FormData) =>
    apiRequest<KnowledgeDocumentItem>(`/knowledge-bases/${kbId}/documents`, { method: "POST", body }, accessToken),
  indexDocument: (accessToken: string, kbId: string, documentId: string) =>
    apiRequest<KnowledgeDocumentItem>(
      `/knowledge-bases/${kbId}/documents/${documentId}/index`,
      { method: "POST" },
      accessToken
    ),
  searchTest: (accessToken: string, kbId: string, query: string, topK = 5) =>
    apiRequest<SearchHit[]>(
      `/knowledge-bases/${kbId}/search-test`,
      { method: "POST", body: JSON.stringify({ query, topK }) },
      accessToken
    )
};
