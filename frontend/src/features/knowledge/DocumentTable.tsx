import { FormEvent } from "react";
import { KnowledgeDocumentItem } from "../../services/api";
import { Badge, Button, EmptyState, Field, Input, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableLoading, TableRow } from "../../components/ui";

type DocumentTableProps = {
  selectedKbId: string | null;
  documents: KnowledgeDocumentItem[];
  loading: boolean;
  uploading: boolean;
  indexingActions: Record<string, "index" | "reindex">;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onIndex: (documentId: string) => void;
  onReindex: (documentId: string) => void;
  onPreview: (documentId: string) => void;
  onDownload: (documentId: string) => void;
  onVersions: (documentId: string) => void;
  onDelete: (documentId: string) => void;
};

export function DocumentTable({ selectedKbId, documents, loading, uploading, indexingActions, onUpload, onIndex, onReindex, onPreview, onDownload, onVersions, onDelete }: DocumentTableProps) {
  return (
    <Panel title="文档与索引" eyebrow="Documents" className="rag-document-panel" state={loading ? "loading" : selectedKbId ? "default" : "empty"} action={<Badge className="tabular-nums">{documents.length} docs</Badge>}>
      <div className="stack">
        <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传文档" description="支持 txt、md、csv、json 等文本类文件。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} /></Field>
          <Button type="submit" variant="primary" loading={uploading} disabled={!selectedKbId}>上传文档</Button>
        </form>
        {loading ? (
          <Table minWidth="980px" density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>文档</TableHead>
                <TableHead status>状态</TableHead>
                <TableHead numeric>版本</TableHead>
                <TableHead numeric>大小</TableHead>
                <TableHead numeric>Chunks</TableHead>
                <TableHead>错误摘要</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableLoading columns={7} rows={4} label="正在加载文档列表" />
          </Table>
        ) : documents.length > 0 ? (
          <Table minWidth="980px" density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>文档</TableHead>
                <TableHead status>状态</TableHead>
                <TableHead numeric>版本</TableHead>
                <TableHead numeric>大小</TableHead>
                <TableHead numeric>Chunks</TableHead>
                <TableHead>错误摘要</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const isBusy = document.documentId in indexingActions;
                const displayStatus = getDocumentDisplayStatus(document, isBusy);
                const failed = isFailedDocument(document);
                const indexActionLabel = getIndexActionLabel(document, isBusy);
                return (
                  <TableRow key={document.documentId} disabled={isBusy} data-document-status={displayStatus} data-has-error={failed || undefined}>
                    <TableCell>
                      <strong className="document-row__title" title={document.fileName}>{document.fileName}</strong>
                      <div className="document-row__meta">
                        <span>{document.fileType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="id-text truncate-id" title={document.documentId}>{document.documentId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="numeric">{formatDateTime(document.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell status>
                      <StatusPill status={getStatusPillStatus(displayStatus)} label={formatParseStatus(displayStatus)} />
                    </TableCell>
                    <TableCell numeric>
                      <span className="tabular-nums">v{document.versionNo}</span>
                    </TableCell>
                    <TableCell numeric>
                      <span className="tabular-nums">{formatFileSize(document.fileSize)}</span>
                    </TableCell>
                    <TableCell numeric>
                      <span className="tabular-nums">{document.chunkCount} chunks</span>
                    </TableCell>
                    <TableCell>
                      <span className="document-error-summary" title={document.lastError ?? undefined}>{document.lastError ?? "-"}</span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="document-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={() => onPreview(document.documentId)}>预览</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => onDownload(document.documentId)}>下载</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => onVersions(document.documentId)}>版本</Button>
                        <Button type="button" variant="secondary" size="sm" aria-label={`${indexActionLabel}：${document.fileName}`} loading={isBusy} disabled={isBusy} onClick={() => (shouldReindexDocument(document) ? onReindex(document.documentId) : onIndex(document.documentId))}>{indexActionLabel}</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(document.documentId)}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
        {!loading && selectedKbId && documents.length === 0 ? <EmptyState title="没有文档" message="上传文档后即可触发索引并参与检索。" /> : null}
        {!loading && !selectedKbId ? <EmptyState title="选择知识库" message="先选择或创建知识库，再上传文档和查看索引状态。" /> : null}
      </div>
    </Panel>
  );
}

function getDocumentDisplayStatus(document: KnowledgeDocumentItem, isBusy: boolean) {
  return isBusy ? "PROCESSING" : document.parseStatus;
}

function isFailedDocument(document: KnowledgeDocumentItem) {
  const status = document.parseStatus.toUpperCase();
  return Boolean(document.lastError) || status.includes("FAILED") || status.includes("ERROR");
}

function shouldReindexDocument(document: KnowledgeDocumentItem) {
  return document.parseStatus === "INDEXED" || isFailedDocument(document);
}

function getIndexActionLabel(document: KnowledgeDocumentItem, isBusy: boolean) {
  if (isBusy) return "索引中";
  if (isFailedDocument(document)) return "重试索引";
  return document.parseStatus === "INDEXED" ? "重新索引" : "触发索引";
}

function getStatusPillStatus(status: string) {
  switch (status.toUpperCase()) {
    case "INDEXED":
      return "COMPLETED";
    case "QUEUED":
      return "PENDING";
    case "UPLOADED":
      return "IDLE";
    default:
      return status;
  }
}

function formatParseStatus(status: string) {
  const labels: Record<string, string> = {
    UPLOADED: "已上传",
    QUEUED: "排队中",
    PROCESSING: "索引中",
    INDEXED: "已索引",
    FAILED: "索引失败"
  };
  return labels[status.toUpperCase()] ?? status;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
