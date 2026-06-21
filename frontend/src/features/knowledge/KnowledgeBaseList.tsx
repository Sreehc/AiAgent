import { FormEvent } from "react";
import { KnowledgeBaseItem } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel, Skeleton, StatusPill, Textarea } from "../../components/ui";

type KnowledgeBaseListProps = {
  items: KnowledgeBaseItem[];
  selectedId: string | null;
  loading: boolean;
  submitting: boolean;
  form: { name: string; description: string };
  onFormChange: (form: { name: string; description: string }) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSelect: (item: KnowledgeBaseItem) => void;
  onRefresh: () => void;
};

export function KnowledgeBaseList({ items, selectedId, loading, submitting, form, onFormChange, onCreate, onSelect, onRefresh }: KnowledgeBaseListProps) {
  return (
    <aside className="knowledge-rail" aria-label="知识库管理">
      <Panel title="新建知识库" eyebrow="Create" className="knowledge-rail__create">
        <form className="form-grid" onSubmit={onCreate}>
          <Field label="名称"><Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required /></Field>
          <Field label="描述"><Textarea value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} rows={3} /></Field>
          <Button type="submit" variant="primary" loading={submitting} fullWidth>创建知识库</Button>
        </form>
      </Panel>
      <Panel title="知识库列表" eyebrow="Library" className="knowledge-rail__list" action={<Button type="button" variant="ghost" size="sm" onClick={onRefresh}>刷新</Button>}>
        <div className="knowledge-rail__items">
          {loading ? <Skeleton lines={4} compact /> : null}
          {!loading && items.map((item) => (
            <button key={item.kbId} type="button" className={`knowledge-base-item ${selectedId === item.kbId ? "knowledge-base-item--active" : ""}`} onClick={() => onSelect(item)}>
              <div className="split"><strong>{item.name}</strong><StatusPill status={item.status} /></div>
              <span>{item.description || "暂无描述"}</span><small className="tabular-nums">{item.documentCount} 个文档 · {formatDateTime(item.updatedAt ?? item.createdAt)}</small>
            </button>
          ))}
          {!loading && items.length === 0 ? <EmptyState title="没有知识库" message="创建知识库后即可上传私有文档并进行检索测试。" /> : null}
        </div>
      </Panel>
    </aside>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
