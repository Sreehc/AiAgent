import { FormEvent } from "react";
import { KnowledgeDocumentItem } from "../../services/api";
import { Badge, Button, EmptyState, Field, Input, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

type DocumentTableProps = {
  selectedKbId: string | null;
  documents: KnowledgeDocumentItem[];
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

export function DocumentTable({ selectedKbId, documents, uploading, indexingActions, onUpload, onIndex, onReindex, onPreview, onDownload, onVersions, onDelete }: DocumentTableProps) {
  return (
    <Panel title="文档与索引" eyebrow="Documents" action={<Badge>{documents.length} docs</Badge>}>
      <div className="stack">
        <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传文档" description="支持 txt、md、csv、json 等文本类文件。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} /></Field>
          <Button type="submit" variant="primary" loading={uploading} disabled={!selectedKbId}>上传文档</Button>
        </form>
        {documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文档</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const isIndexed = document.parseStatus === "INDEXED";
                const isBusy = document.documentId in indexingActions;
                return (
                  <TableRow key={document.documentId}>
                    <TableCell>
                      <strong>{document.fileName}</strong>
                      <div className="text-xs text-muted-foreground">{document.fileType} · v{document.versionNo} · {document.fileSize} bytes · {document.chunkCount} chunks</div>
                      {document.lastError ? <p className="mt-1 text-xs text-destructive">{document.lastError}</p> : null}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={document.parseStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => onPreview(document.documentId)}>预览</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => onDownload(document.documentId)}>下载</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => onVersions(document.documentId)}>版本</Button>
                        <Button type="button" variant="secondary" size="sm" loading={isBusy} onClick={() => (isIndexed ? onReindex(document.documentId) : onIndex(document.documentId))}>{isIndexed ? "重新索引" : "触发索引"}</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(document.documentId)}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
        {selectedKbId && documents.length === 0 ? <EmptyState title="没有文档" message="上传文档后即可触发索引并参与检索。" /> : null}
      </div>
    </Panel>
  );
}
