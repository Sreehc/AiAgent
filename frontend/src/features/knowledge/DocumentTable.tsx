import { FormEvent } from "react";
import { KnowledgeDocumentItem } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel, StatusPill } from "../../components/ui";

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
    <Panel title="文档与索引" eyebrow="Documents" action={<span className="badge">{documents.length} docs</span>}>
      <div className="stack">
        <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传文档" description="支持 txt、md、csv、json 等文本类文件。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} /></Field>
          <Button type="submit" variant="primary" loading={uploading} disabled={!selectedKbId}>上传文档</Button>
        </form>
        <div className="table-list">
          {documents.map((document) => {
            const isIndexed = document.parseStatus === "INDEXED";
            const isBusy = document.documentId in indexingActions;
            return <article key={document.documentId} className="table-row"><div><strong>{document.fileName}</strong><br /><small>{document.fileType} · v{document.versionNo} · {document.fileSize} bytes · {document.chunkCount} chunks</small>{document.lastError ? <p className="document-error">{document.lastError}</p> : null}</div><StatusPill status={document.parseStatus} /><div className="cluster"><Button type="button" variant="secondary" size="sm" onClick={() => onPreview(document.documentId)}>预览</Button><Button type="button" variant="secondary" size="sm" onClick={() => onDownload(document.documentId)}>下载</Button><Button type="button" variant="secondary" size="sm" onClick={() => onVersions(document.documentId)}>版本</Button><Button type="button" variant="secondary" size="sm" loading={isBusy} onClick={() => isIndexed ? onReindex(document.documentId) : onIndex(document.documentId)}>{isIndexed ? "重新索引" : "触发索引"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => onDelete(document.documentId)}>删除</Button></div></article>;
          })}
        </div>
        {selectedKbId && documents.length === 0 ? <EmptyState title="没有文档" message="上传文档后即可触发索引并参与检索。" /> : null}
      </div>
    </Panel>
  );
}
