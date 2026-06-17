import { KnowledgeDocumentItem } from "../../services/api";
import { Button, EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

type DocumentVersionsPanelProps = {
  versions: KnowledgeDocumentItem[];
  onRestore: (versionId: string) => void;
  onClose: () => void;
};

export function DocumentVersionsPanel({ versions, onRestore, onClose }: DocumentVersionsPanelProps) {
  return (
    <Panel title="文档版本" eyebrow="Versions" action={<Button type="button" variant="ghost" size="sm" onClick={onClose}>关闭</Button>}>
      {versions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((item, index) => (
              <TableRow key={item.documentId}>
                <TableCell>
                  <strong>{item.fileName}</strong>
                  <div className="text-xs text-muted-foreground">v{item.versionNo} · {item.fileSize} bytes · {item.documentId}{index === 0 ? " · 当前最高版本" : ""}</div>
                </TableCell>
                <TableCell>
                  <StatusPill status={item.parseStatus} />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onRestore(item.documentId)}>恢复为新版本</Button>
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
