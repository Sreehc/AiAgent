import { KnowledgeBaseItem, KnowledgeDocumentItem } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel, Skeleton, StatusPill, Textarea } from "../../components/ui";

type KnowledgeBaseSummaryProps = {
  item: KnowledgeBaseItem | null;
  documents: KnowledgeDocumentItem[];
  searchHitCount: number;
  loading: boolean;
  form: { name: string; description: string };
  submitting: boolean;
  onFormChange: (form: { name: string; description: string }) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function KnowledgeBaseSummary({ item, documents, searchHitCount, loading, form, submitting, onFormChange, onSave, onDelete }: KnowledgeBaseSummaryProps) {
  const chunkCount = documents.reduce((sum, document) => sum + document.chunkCount, 0);
  const indexedDocuments = documents.filter((document) => document.parseStatus === "INDEXED").length;
  const failedDocuments = documents.filter((document) => isFailedDocument(document)).length;

  return (
    <Panel title={item?.name ?? "选择一个知识库"} eyebrow="RAG cockpit" className="knowledge-summary" action={<StatusPill status={item?.status ?? "IDLE"} />} state={loading ? "loading" : item ? "default" : "empty"}>
      {loading ? <Skeleton variant="card" lines={4} label="正在加载知识库摘要" /> : item ? (
        <div className="form-grid">
          <div className="knowledge-summary-grid">
            <div className="meta-card"><span>状态</span><strong>{item.status}</strong></div>
            <div className="meta-card"><span>文档数</span><strong className="tabular-nums">{item.documentCount}</strong></div>
            <div className="meta-card"><span>Chunks</span><strong className="tabular-nums">{chunkCount}</strong></div>
            <div className="meta-card"><span>已索引</span><strong className="tabular-nums">{indexedDocuments}</strong></div>
            <div className="meta-card"><span>失败</span><strong className="tabular-nums">{failedDocuments}</strong></div>
            <div className="meta-card"><span>命中</span><strong className="tabular-nums">{searchHitCount}</strong></div>
            <div className="meta-card"><span>更新时间</span><strong>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</strong></div>
          </div>
          <Field label="名称"><Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} /></Field>
          <Field label="描述"><Textarea value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} rows={3} /></Field>
          <div className="cluster"><Button type="button" variant="primary" loading={submitting} onClick={onSave}>保存配置</Button><Button type="button" variant="danger" disabled={submitting} onClick={onDelete}>删除知识库</Button></div>
        </div>
      ) : <EmptyState message="从左侧选择知识库后，可查看文档、索引状态和检索结果。" />}
    </Panel>
  );
}

function isFailedDocument(document: KnowledgeDocumentItem) {
  const status = document.parseStatus.toUpperCase();
  return Boolean(document.lastError) || status.includes("FAILED") || status.includes("ERROR");
}
