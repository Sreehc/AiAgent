import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  apiRequest,
  ApiError,
  KnowledgeBaseItem,
  KnowledgeDocumentItem,
  SearchHit
} from "../services/api";

const DEFAULT_KB_FORM = {
  name: "行业研究资料库",
  description: "用于沉淀行业报告、访谈纪要和私有研究文档"
};

export function KnowledgeBasesPage() {
  const { session } = useAuthSession();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [kbForm, setKbForm] = useState(DEFAULT_KB_FORM);
  const [searchQuery, setSearchQuery] = useState("储能成本下降趋势");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedKnowledgeBase = useMemo(
    () => knowledgeBases.find((item) => item.kbId === selectedKbId) ?? null,
    [knowledgeBases, selectedKbId]
  );

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadKnowledgeBases();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !selectedKbId) {
      setDocuments([]);
      return;
    }
    void loadDocuments(selectedKbId);
  }, [selectedKbId, session?.accessToken]);

  async function loadKnowledgeBases() {
    if (!session?.accessToken) {
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<KnowledgeBaseItem[]>("/knowledge-bases", {}, session.accessToken);
      setKnowledgeBases(result);
      setSelectedKbId((current) => current ?? result[0]?.kbId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(kbId: string) {
    if (!session?.accessToken) {
      return;
    }
    try {
      const result = await apiRequest<KnowledgeDocumentItem[]>(
        `/knowledge-bases/${kbId}/documents`,
        {},
        session.accessToken
      );
      setDocuments(result);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onCreateKnowledgeBase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiRequest<KnowledgeBaseItem>(
        "/knowledge-bases",
        {
          method: "POST",
          body: JSON.stringify(kbForm)
        },
        session.accessToken
      );
      await loadKnowledgeBases();
      setSelectedKbId(created.kbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onRenameKnowledgeBase() {
    if (!session?.accessToken || !selectedKbId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<KnowledgeBaseItem>(
        `/knowledge-bases/${selectedKbId}`,
        {
          method: "PUT",
          body: JSON.stringify(kbForm)
        },
        session.accessToken
      );
      await loadKnowledgeBases();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteKnowledgeBase() {
    if (!session?.accessToken || !selectedKbId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<void>(
        `/knowledge-bases/${selectedKbId}`,
        {
          method: "DELETE"
        },
        session.accessToken
      );
      setSearchHits([]);
      await loadKnowledgeBases();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedKbId) {
      return;
    }
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("请选择一个文档文件");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      await apiRequest<KnowledgeDocumentItem>(
        `/knowledge-bases/${selectedKbId}/documents`,
        {
          method: "POST",
          body
        },
        session.accessToken
      );
      form.reset();
      await loadKnowledgeBases();
      await loadDocuments(selectedKbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  async function onIndexDocument(documentId: string) {
    if (!session?.accessToken || !selectedKbId) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await apiRequest<KnowledgeDocumentItem>(
        `/knowledge-bases/${selectedKbId}/documents/${documentId}/index`,
        {
          method: "POST"
        },
        session.accessToken
      );
      await loadDocuments(selectedKbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSearchTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedKbId) {
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const result = await apiRequest<SearchHit[]>(
        `/knowledge-bases/${selectedKbId}/search-test`,
        {
          method: "POST",
          body: JSON.stringify({
            query: searchQuery,
            topK: 5
          })
        },
        session.accessToken
      );
      setSearchHits(result);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSearching(false);
    }
  }

  function onSelectKnowledgeBase(kb: KnowledgeBaseItem) {
    setSelectedKbId(kb.kbId);
    setKbForm({
      name: kb.name,
      description: kb.description ?? ""
    });
  }

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Knowledge Workspace</p>
          <h2>知识库工作区</h2>
        </div>
        <span className="badge">{selectedKnowledgeBase ? selectedKnowledgeBase.status : "ACTIVE"}</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>新建知识库</h3>
            <form className="workspace-form" onSubmit={onCreateKnowledgeBase}>
              <label>
                名称
                <input
                  value={kbForm.name}
                  onChange={(event) => setKbForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="例如：储能产业资料库"
                />
              </label>
              <label>
                描述
                <textarea
                  value={kbForm.description}
                  onChange={(event) =>
                    setKbForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  placeholder="说明这个知识库会沉淀哪些文档"
                />
              </label>
              <button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "创建知识库"}
              </button>
            </form>
          </div>

          <div className="workspace-sidebar__section">
            <div className="workspace-sidebar__heading">
              <h3>知识库列表</h3>
              <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadKnowledgeBases()}>
                刷新
              </button>
            </div>
            {loading ? <p className="muted">正在加载知识库...</p> : null}
            <div className="session-list">
              {knowledgeBases.map((item) => (
                <button
                  key={item.kbId}
                  type="button"
                  className={`session-card ${selectedKbId === item.kbId ? "session-card--active" : ""}`}
                  onClick={() => onSelectKnowledgeBase(item)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.kbId}</span>
                  <small>
                    {item.documentCount} docs · {formatDateTime(item.createdAt)}
                  </small>
                </button>
              ))}
              {!loading && knowledgeBases.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有知识库，先创建一个用于沉淀私有文档。</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">Documents</p>
                <h3>{selectedKnowledgeBase?.name ?? "选择一个知识库"}</h3>
              </div>
              <div className="workspace-inline-actions">
                <button type="button" className="ghost-button ghost-button--inline" disabled={!selectedKbId || submitting} onClick={() => void onRenameKnowledgeBase()}>
                  重命名
                </button>
                <button type="button" className="ghost-button ghost-button--inline ghost-button--danger" disabled={!selectedKbId || submitting} onClick={() => void onDeleteKnowledgeBase()}>
                  删除
                </button>
              </div>
            </div>

            <form className="workspace-form" onSubmit={onUploadDocument}>
              <label>
                上传文档
                <input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} />
              </label>
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button type="submit" disabled={!selectedKbId || uploading}>
                {uploading ? "处理中..." : "上传文档"}
              </button>
            </form>

            <div className="doc-list">
              {documents.map((document) => (
                <article key={document.documentId} className="plan-card">
                  <div className="plan-card__header">
                    <strong>{document.fileName}</strong>
                    <span>{document.parseStatus}</span>
                  </div>
                  <p className="muted">
                    {document.fileType} · {document.chunkCount} chunks
                  </p>
                  <div className="workspace-inline-actions">
                    <button
                      type="button"
                      className="ghost-button ghost-button--inline"
                      disabled={uploading}
                      onClick={() => void onIndexDocument(document.documentId)}
                    >
                      触发索引
                    </button>
                  </div>
                </article>
              ))}
              {selectedKbId && documents.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>当前知识库还没有文档，上传后即可索引并参与检索。</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">Search</p>
                <h3>检索测试</h3>
              </div>
              <span className="muted">{searchHits.length} hits</span>
            </div>

            <form className="workspace-form" onSubmit={onSearchTest}>
              <label>
                检索问题
                <textarea
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  rows={4}
                  placeholder="例如：储能成本下降趋势"
                />
              </label>
              <button type="submit" disabled={!selectedKbId || searching}>
                {searching ? "检索中..." : "开始检索"}
              </button>
            </form>

            <div className="event-list">
              {searchHits.map((hit) => (
                <article key={hit.chunkId} className="event-card">
                  <div className="event-card__header">
                    <strong>{hit.fileName}</strong>
                    <small>{hit.score.toFixed(4)}</small>
                  </div>
                  <p className="muted">
                    {hit.kbId} · chunk {hit.chunkNo}
                  </p>
                  <p>{hit.contentPreview}</p>
                </article>
              ))}
              {selectedKbId && searchHits.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>完成文档索引后，可以在这里验证检索效果。</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
