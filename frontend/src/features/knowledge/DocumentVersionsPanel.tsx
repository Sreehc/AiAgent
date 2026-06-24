import { KnowledgeDocumentItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

type DocumentVersionsPanelProps = {
  versions: KnowledgeDocumentItem[];
  onRestore: (versionId: string) => void;
  onClose: () => void;
};

export function DocumentVersionsPanel({ versions, onRestore, onClose }: DocumentVersionsPanelProps) {
  return (
    <Panel title="文档版本" eyebrow="Versions" className="document-version-panel" action={<Button type="button" variant="ghost" size="sm" onClick={onClose}>关闭</Button>}>
      {versions.length > 0 ? (
        <Table minWidth="860px" density="compact">
          <TableHeader>
            <TableRow>
              <TableHead numeric>版本</TableHead>
              <TableHead status>状态</TableHead>
              <TableHead numeric>大小</TableHead>
              <TableHead numeric>Chunks</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>文档 ID</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((item, index) => (
              <TableRow key={item.documentId}>
                <TableCell numeric>
                  <div className="document-version-cell">
                    <strong className="numeric">v{item.versionNo}</strong>
                    <span title={item.fileName}>{item.fileName}</span>
                    {index === 0 ? <Badge tone="neutral">当前最高版本</Badge> : null}
                  </div>
                </TableCell>
                <TableCell status>
                  <StatusPill status={getStatusPillStatus(item.parseStatus)} label={formatParseStatus(item.parseStatus)} />
                </TableCell>
                <TableCell numeric>
                  <span className="numeric">{formatFileSize(item.fileSize)}</span>
                </TableCell>
                <TableCell numeric>
                  <span className="numeric">{item.chunkCount} chunks</span>
                </TableCell>
                <TableCell>
                  <span className="numeric">{formatDateTime(item.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <span className="id-text truncate-id" title={item.documentId}>{item.documentId}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="secondary" size="sm" aria-label={`恢复版本 v${item.versionNo}：${item.fileName}`} onClick={() => onRestore(item.documentId)}>恢复为新版本</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState message="暂无版本记录。" />
      )}
    </Panel>
  );
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
