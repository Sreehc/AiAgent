import { Badge, Button, EmptyState, Field, Panel, Textarea } from "../../components/ui";

type MemoryPanelProps = {
  selected: boolean;
  content: string;
  saving: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
  onClear: () => void;
  onRebuild: () => void;
};

export function MemoryPanel({ selected, content, saving, onChange, onSave, onClear, onRebuild }: MemoryPanelProps) {
  return (
    <Panel title="会话记忆" eyebrow="Memory" action={<Badge className="tabular-nums">{Math.ceil(content.length / 4)} tokens</Badge>}>
      {!selected ? <EmptyState message="选择会话后可以查看和编辑记忆摘要。" /> : (
        <div className="form-grid">
          <Field label="摘要上下文" description="该内容会注入下一次研究任务。">
            <Textarea value={content} onChange={(event) => onChange(event.target.value)} rows={7} placeholder="暂无会话记忆。" />
          </Field>
          <div className="cluster">
            <Button type="button" variant="primary" loading={saving} onClick={onSave}>保存记忆</Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={onRebuild}>从历史重建</Button>
            <Button type="button" variant="ghost" disabled={saving || !content} onClick={onClear}>清空</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
