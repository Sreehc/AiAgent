import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Badge } from "../components/ui";
import { showToast } from "../components/Toast";
import { DocumentTable } from "../features/knowledge/DocumentTable";
import { DocumentVersionsPanel } from "../features/knowledge/DocumentVersionsPanel";
import { KnowledgeBaseList } from "../features/knowledge/KnowledgeBaseList";
import { KnowledgeBaseSummary } from "../features/knowledge/KnowledgeBaseSummary";
import { SearchTestPanel } from "../features/knowledge/SearchTestPanel";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, KnowledgeBaseItem, KnowledgeDocumentItem, SearchHit } from "../services/api";
import { knowledgeApi } from "../services/knowledgeApi";

const DEFAULT_KB_FORM = { name: "行业研究资料库", description: "用于沉淀行业报告、访谈纪要和私有研究文档" };

export function KnowledgeBasesPage() {
  const { session } = useAuthSession();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [kbForm, setKbForm] = useState(DEFAULT_KB_FORM);
  const [searchQuery, setSearchQuery] = useState("储能成本下降趋势");
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [indexingActions, setIndexingActions] = useState<Record<string, "index" | "reindex">>({});
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBaseItem | null>(null);
  const [versionSourceDocumentId, setVersionSourceDocumentId] = useState<string | null>(null);
  const [documentVersions, setDocumentVersions] = useState<KnowledgeDocumentItem[]>([]);

  const selected = useMemo(() => knowledgeBases.find((item) => item.kbId === selectedKbId) ?? null, [knowledgeBases, selectedKbId]);
  const cockpitStats = useMemo(() => {
    const totalDocuments = knowledgeBases.reduce((sum, item) => sum + item.documentCount, 0);
    const chunkCount = documents.reduce((sum, document) => sum + document.chunkCount, 0);
    const indexedDocuments = documents.filter((document) => document.parseStatus === "INDEXED").length;
    const failedDocuments = documents.filter((document) => isFailedDocument(document)).length;
    const indexingDocuments = documents.filter((document) => document.documentId in indexingActions).length;
    return { totalDocuments, chunkCount, indexedDocuments, failedDocuments, indexingDocuments };
  }, [documents, indexingActions, knowledgeBases]);

  useEffect(() => {
    if (session?.accessToken) void loadKnowledgeBases();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !selectedKbId) {
      setDocuments([]);
      setLoadingDocuments(false);
      return;
    }
    void loadDocuments(selectedKbId);
  }, [selectedKbId, session?.accessToken]);

  async function loadKnowledgeBases() {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const result = await knowledgeApi.list(session.accessToken);
      setKnowledgeBases(result);
      setSelectedKbId((current) => current && result.some((item) => item.kbId === current) ? current : result[0]?.kbId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(kbId: string) {
    if (!session?.accessToken) return;
    setLoadingDocuments(true);
    try {
      setDocuments(await knowledgeApi.listDocuments(session.accessToken, kbId));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoadingDocuments(false);
    }
  }

  function selectKnowledgeBase(item: KnowledgeBaseItem) {
    setSelectedKbId(item.kbId);
    setKbForm({ name: item.name, description: item.description ?? "" });
    setSearchHits([]);
    setHasSearched(false);
    setVersionSourceDocumentId(null);
    setDocumentVersions([]);
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
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

  async function onSave() {
    if (!session?.accessToken || !selectedKbId) return;
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

  async function onDelete() {
    if (!session?.accessToken || !kbToDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      await knowledgeApi.remove(session.accessToken, kbToDelete.kbId);
      setSelectedKbId(null);
      setSearchHits([]);
      setHasSearched(false);
      setKbToDelete(null);
      setKbForm(DEFAULT_KB_FORM);
      await loadKnowledgeBases();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedKbId) return;
    const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
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
      event.currentTarget.reset();
      await Promise.all([loadKnowledgeBases(), loadDocuments(selectedKbId)]);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  async function onIndex(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    setIndexingActions((current) => ({ ...current, [documentId]: "index" }));
    setError(null);
    try {
      await knowledgeApi.indexDocument(session.accessToken, selectedKbId, documentId);
      await loadDocuments(selectedKbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setIndexingActions((current) => {
        const next = { ...current };
        delete next[documentId];
        return next;
      });
    }
  }

  async function onReindex(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    setIndexingActions((current) => ({ ...current, [documentId]: "reindex" }));
    setError(null);
    try {
      await knowledgeApi.reindexDocument(session.accessToken, selectedKbId, documentId);
      await loadDocuments(selectedKbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setIndexingActions((current) => {
        const next = { ...current };
        delete next[documentId];
        return next;
      });
    }
  }

  async function onPreviewDocument(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    try {
      const result = await knowledgeApi.getDocument(session.accessToken, selectedKbId, documentId);
      showToast("info", result.preview || "该文档没有可预览内容");
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onDownloadDocument(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    try {
      const result = await knowledgeApi.downloadDocument(session.accessToken, selectedKbId, documentId);
      window.open(result.url, "_blank", "noreferrer");
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onVersionsDocument(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    try {
      const result = await knowledgeApi.listDocumentVersions(session.accessToken, selectedKbId, documentId);
      setVersionSourceDocumentId(documentId);
      setDocumentVersions(result);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onRestoreVersion(versionId: string) {
    if (!session?.accessToken || !selectedKbId || !versionSourceDocumentId) return;
    setError(null);
    try {
      await knowledgeApi.restoreDocumentVersion(session.accessToken, selectedKbId, versionSourceDocumentId, versionId);
      setDocumentVersions([]);
      setVersionSourceDocumentId(null);
      await loadDocuments(selectedKbId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onDeleteDocument(documentId: string) {
    if (!session?.accessToken || !selectedKbId) return;
    try {
      await knowledgeApi.deleteDocument(session.accessToken, selectedKbId, documentId);
      await Promise.all([loadKnowledgeBases(), loadDocuments(selectedKbId)]);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedKbId) return;
    setSearching(true);
    setError(null);
    try {
      setSearchHits(await knowledgeApi.searchTest(session.accessToken, selectedKbId, searchQuery, 5));
      setHasSearched(true);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="page page--knowledge">
      <header className="page-header"><div><h1>知识库</h1><p>管理私有文档、索引状态，并在投入研究任务前验证召回质量。</p></div><div className="page-header__meta"><Badge tone="neutral" className="tabular-nums">{knowledgeBases.length} 个知识库</Badge><Badge tone="neutral" className="tabular-nums">{cockpitStats.totalDocuments} 个文档</Badge><Badge tone="neutral" className="tabular-nums">{cockpitStats.chunkCount} chunks</Badge></div><Badge className="tabular-nums">{searchHits.length} 个命中</Badge></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="knowledge-cockpit">
        <div className="knowledge-cockpit__rail">
          <KnowledgeBaseList items={knowledgeBases} selectedId={selectedKbId} loading={loading} submitting={submitting} form={kbForm} onFormChange={setKbForm} onCreate={onCreate} onSelect={selectKnowledgeBase} onRefresh={() => void loadKnowledgeBases()} />
        </div>
        <main className="knowledge-cockpit__main" aria-label="RAG cockpit">
          <KnowledgeBaseSummary item={selected} documents={documents} searchHitCount={searchHits.length} loading={loading || loadingDocuments} form={kbForm} submitting={submitting} onFormChange={setKbForm} onSave={() => void onSave()} onDelete={() => selected && setKbToDelete(selected)} />
          <DocumentTable selectedKbId={selectedKbId} documents={documents} loading={loadingDocuments} uploading={uploading} indexingActions={indexingActions} onUpload={onUpload} onIndex={(documentId) => void onIndex(documentId)} onReindex={(documentId) => void onReindex(documentId)} onPreview={(documentId) => void onPreviewDocument(documentId)} onDownload={(documentId) => void onDownloadDocument(documentId)} onVersions={(documentId) => void onVersionsDocument(documentId)} onDelete={(documentId) => void onDeleteDocument(documentId)} />
          {versionSourceDocumentId ? <DocumentVersionsPanel versions={documentVersions} onRestore={(versionId) => void onRestoreVersion(versionId)} onClose={() => { setVersionSourceDocumentId(null); setDocumentVersions([]); }} /> : null}
          <SearchTestPanel selected={selectedKbId !== null} query={searchQuery} hits={searchHits} searching={searching} hasSearched={hasSearched} onQueryChange={setSearchQuery} onSearch={onSearch} />
        </main>
      </div>
      <ConfirmDialog isOpen={kbToDelete !== null} title="确认删除知识库" message={<>确定要删除知识库「<strong>{kbToDelete?.name}</strong>」吗？关联文档和索引会一并删除。</>} confirmText="删除知识库" cancelText="取消" onConfirm={onDelete} onCancel={() => setKbToDelete(null)} danger />
    </section>
  );
}

function isFailedDocument(document: KnowledgeDocumentItem) {
  const status = document.parseStatus.toUpperCase();
  return Boolean(document.lastError) || status.includes("FAILED") || status.includes("ERROR");
}
