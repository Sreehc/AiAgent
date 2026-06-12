import { KnowledgeBaseItem } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel, StatusPill, Textarea } from "../../components/ui";

type KnowledgeBaseSummaryProps = {
  item: KnowledgeBaseItem | null;
  form: { name: string; description: string };
  submitting: boolean;
  onFormChange: (form: { name: string; description: string }) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function KnowledgeBaseSummary({ item, form, submitting, onFormChange, onSave, onDelete }: KnowledgeBaseSummaryProps) {
  return (
    <Panel title={item?.name ?? "选择一个知识库"} eyebrow="Overview" action={<StatusPill status={item?.status ?? "IDLE"} />}>
      {item ? (
        <div className="form-grid">
          <div className="meta-grid"><div className="meta-card"><span>文档数</span><strong>{item.documentCount}</strong></div><div className="meta-card"><span>状态</span><strong>{item.status}</strong></div><div className="meta-card"><span>更新时间</span><strong>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</strong></div></div>
          <Field label="名称"><Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} /></Field>
          <Field label="描述"><Textarea value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} rows={3} /></Field>
          <div className="cluster"><Button type="button" variant="primary" loading={submitting} onClick={onSave}>保存配置</Button><Button type="button" variant="danger" disabled={submitting} onClick={onDelete}>删除知识库</Button></div>
        </div>
      ) : <EmptyState message="从左侧选择知识库后，可查看文档、索引状态和检索结果。" />}
    </Panel>
  );
}
