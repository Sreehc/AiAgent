import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Button, EmptyState, Field, Input, Panel, StatusPill, Textarea } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, KnowledgeBaseItem, KnowledgeDocumentItem, SearchHit } from "../services/api";
import { knowledgeApi } from "../services/knowledgeApi";

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
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBaseItem | null>(null);

  const selectedKnowledgeBase = useMemo(() => knowledgeBases.find((item) => item.kbId === selectedKbId) ?? null, [knowledgeBases, selectedKbId]);

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
      const result = await knowledgeApi.list(session.accessToken);
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
      const result = await knowledgeApi.listDocuments(session.accessToken, kbId);
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
      const created = await knowledgeApi.create(session.accessToken, kbForm);
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
      await knowledgeApi.update(session.accessToken, selectedKbId, kbForm);
      await loadKnowledgeBases();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirmDeleteKb() {
    if (!session?.accessToken || !kbToDelete) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await knowledgeApi.remove(session.accessToken, kbToDelete.kbId);
      setSearchHits([]);
      setSelectedKbId(null);
      setKbToDelete(null);
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
      await knowledgeApi.uploadDocument(session.accessToken, selectedKbId, body);
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
      await knowledgeApi.indexDocument(session.accessToken, selectedKbId, documentId);
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
      const result = await knowledgeApi.searchTest(session.accessToken, selectedKbId, searchQuery, 5);
      setSearchHits(result);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSearching(false);
    }
  }

  function onSelectKnowledgeBase(kb: KnowledgeBaseItem) {
    setSelectedKbId(kb.kbId);
    setKbForm({ name: kb.name, description: kb.description ?? "" });
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>知识库</h1>
        <div className="page-header__meta">
          <span className="badge badge--neutral">{documents.length} 个文档</span>
          <span className="badge badge--neutral">{searchHits.length} 个命中</span>
        </div>
        <span className="badge">{loading ? "加载中" : `${knowledgeBases.length} 个知识库`}</span>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-grid">
        <aside className="stack">
          <Panel title="新建知识库" eyebrow="Create">
            <form className="form-grid" onSubmit={onCreateKnowledgeBase}>
              <Field label="名称"><Input value={kbForm.name} onChange={(event) => setKbForm((current) => ({ ...current, name: event.target.value }))} /></Field>
              <Field label="描述"><Textarea value={kbForm.description} onChange={(event) => setKbForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></Field>
              <Button type="submit" variant="primary" loading={submitting} fullWidth>创建知识库</Button>
            </form>
          </Panel>
          <Panel title="知识库列表" eyebrow="Library" action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadKnowledgeBases()}>刷新</Button>}>
            <div className="list">
              {knowledgeBases.map((item) => (
                <button key={item.kbId} type="button" className={`list-item ${selectedKbId === item.kbId ? "list-item--active" : ""}`} onClick={() => onSelectKnowledgeBase(item)}>
                  <strong>{item.name}</strong>
                  <span>{item.kbId}</span>
                  <small>{item.documentCount} docs · {formatDateTime(item.updatedAt ?? item.createdAt)}</small>
                </button>
              ))}
              {!loading && knowledgeBases.length === 0 ? <EmptyState message="还没有知识库，先创建一个用于沉淀私有文档。" /> : null}
            </div>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title={selectedKnowledgeBase?.name ?? "选择一个知识库"} eyebrow="Documents" action={<StatusPill status={selectedKnowledgeBase?.status ?? "IDLE"} />}>
            <div className="stack">
              <div className="cluster">
                <Button type="button" variant="secondary" disabled={!selectedKbId || submitting} onClick={() => void onRenameKnowledgeBase()}>保存名称</Button>
                <Button type="button" variant="danger" disabled={!selectedKnowledgeBase || submitting} onClick={() => selectedKnowledgeBase && setKbToDelete(selectedKnowledgeBase)}>删除知识库</Button>
              </div>
              <form className="form-grid" onSubmit={onUploadDocument}>
                <Field label="上传文档" description="支持 txt、md、csv、json 等文本类文件。">
                  <Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} />
                </Field>
                <Button type="submit" variant="primary" loading={uploading} disabled={!selectedKbId}>上传文档</Button>
              </form>
              <div className="table-list">
                {documents.map((document) => (
                  <article key={document.documentId} className="table-row">
                    <div><strong>{document.fileName}</strong><br /><small>{document.fileType} · {document.chunkCount} chunks</small></div>
                    <StatusPill status={document.parseStatus} />
                    <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => void onIndexDocument(document.documentId)}>触发索引</Button>
                  </article>
                ))}
              </div>
              {selectedKbId && documents.length === 0 ? <EmptyState message="当前知识库还没有文档，上传后即可索引并参与检索。" /> : null}
            </div>
          </Panel>

          <Panel title="检索测试" eyebrow="Search" action={<span className="badge">{searchHits.length} hits</span>}>
            <form className="form-grid" onSubmit={onSearchTest}>
              <Field label="检索问题"><Textarea value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} rows={4} /></Field>
              <Button type="submit" variant="primary" loading={searching} disabled={!selectedKbId}>开始检索</Button>
            </form>
            <div className="timeline" style={{ marginTop: "var(--space-4)" }}>
              {searchHits.map((hit) => (
                <article key={hit.chunkId} className="timeline-item">
                  <div className="timeline-item__header"><strong>{hit.fileName}</strong><small>{hit.score.toFixed(4)}</small></div>
                  <p className="muted">{hit.kbId} · chunk {hit.chunkNo}</p>
                  <p>{hit.contentPreview}</p>
                </article>
              ))}
              {searchHits.length === 0 ? <EmptyState message="输入问题后可验证当前知识库的召回片段。" /> : null}
            </div>
          </Panel>
        </main>
      </div>

      <ConfirmDialog
        isOpen={kbToDelete !== null}
        title="确认删除知识库"
        message={<>确定要删除知识库「<strong>{kbToDelete?.name}</strong>」吗？关联文档和索引会一并删除。</>}
        confirmText="删除知识库"
        cancelText="取消"
        onConfirm={onConfirmDeleteKb}
        onCancel={() => setKbToDelete(null)}
        danger
      />
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
