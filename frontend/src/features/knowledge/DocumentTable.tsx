import { FormEvent } from "react";
import { KnowledgeDocumentItem } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel, StatusPill } from "../../components/ui";

type DocumentTableProps = {
  selectedKbId: string | null;
  documents: KnowledgeDocumentItem[];
  uploading: boolean;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onIndex: (documentId: string) => void;
};

export function DocumentTable({ selectedKbId, documents, uploading, onUpload, onIndex }: DocumentTableProps) {
  return (
    <Panel title="文档与索引" eyebrow="Documents" action={<span className="badge">{documents.length} docs</span>}>
      <div className="stack">
        <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传文档" description="支持 txt、md、csv、json 等文本类文件。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!selectedKbId || uploading} /></Field>
          <Button type="submit" variant="primary" loading={uploading} disabled={!selectedKbId}>上传文档</Button>
        </form>
        <div className="table-list">
          {documents.map((document) => <article key={document.documentId} className="table-row"><div><strong>{document.fileName}</strong><br /><small>{document.fileType} · {document.chunkCount} chunks</small></div><StatusPill status={document.parseStatus} /><Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => onIndex(document.documentId)}>触发索引</Button></article>)}
        </div>
        {selectedKbId && documents.length === 0 ? <EmptyState title="没有文档" message="上传文档后即可触发索引并参与检索。" /> : null}
      </div>
    </Panel>
  );
}
