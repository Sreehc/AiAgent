import { FormEvent } from "react";
import { ModelConfigPayload } from "../../services/adminApi";
import { Button, Field, Input, Panel, Select, Switch } from "../../components/ui";

type ModelFormProps = {
  form: ModelConfigPayload;
  submitting: boolean;
  onChange: (form: ModelConfigPayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ModelForm({ form, submitting, onChange, onSubmit }: ModelFormProps) {
  return (
    <Panel title="新增模型" eyebrow="Provider setup" description="录入 OpenAI-compatible 模型服务。">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="模型代码"><Input value={form.modelCode} onChange={(event) => onChange({ ...form, modelCode: event.target.value })} required /></Field>
        <Field label="名称"><Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required /></Field>
        <Field label="服务商"><Input value={form.provider} onChange={(event) => onChange({ ...form, provider: event.target.value })} required /></Field>
        <Field label="模型类型"><Select value={form.modelType} onChange={(event) => onChange({ ...form, modelType: event.target.value as ModelConfigPayload["modelType"] })}><option value="CHAT">Chat</option><option value="EMBEDDING">Embedding</option><option value="IMAGE">Image</option></Select></Field>
        <Field label="API 地址"><Input type="url" value={form.baseUrl} onChange={(event) => onChange({ ...form, baseUrl: event.target.value })} required /></Field>
        <Field label="API Key" description="仅创建或轮换时填写，列表只展示脱敏值。"><Input type="password" value={form.apiKey} onChange={(event) => onChange({ ...form, apiKey: event.target.value })} /></Field>
        <Switch label="创建后启用" description="停用模型不会被运行时选择。" checked={form.enabled} onChange={(event) => onChange({ ...form, enabled: event.target.checked })} />
        <div className="cluster"><Button type="button" variant="secondary" disabled title="后端尚未提供模型测试接口">测试连接（待后端支持）</Button><Button type="submit" variant="primary" loading={submitting}>创建模型</Button></div>
      </form>
    </Panel>
  );
}
