import { FormEvent } from "react";
import { McpTransportType } from "../../services/adminApi";
import { Alert, Button, Field, Input, Panel, Select, Switch } from "../../components/ui";

export type McpFormState = {
  name: string;
  serverCode: string;
  transportType: McpTransportType;
  endpoint: string;
  commandLine: string | null;
  active: boolean;
};

type McpServerFormProps = {
  form: McpFormState;
  editing: boolean;
  submitting: boolean;
  onChange: (form: McpFormState) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: () => void;
  onDelete: () => void;
};

export function McpServerForm({ form, editing, submitting, onChange, onCreate, onUpdate, onDelete }: McpServerFormProps) {
  const fields = (
    <>
      <Field label="名称"><Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required /></Field>
      <Field label="服务代码"><Input value={form.serverCode} onChange={(event) => onChange({ ...form, serverCode: event.target.value })} disabled={editing} required /></Field>
      <Field label="传输协议"><Select value={form.transportType} onChange={(event) => onChange({ ...form, transportType: event.target.value as McpFormState["transportType"] })}><option value="SSE">SSE</option><option value="STREAMABLE_HTTP">Streamable HTTP</option><option value="STDIO">STDIO</option></Select></Field>
      <Field label="服务端点" description={form.transportType === "STDIO" ? "STDIO 服务不需要远程 endpoint。" : "仅允许访问后端白名单中的主机。"}><Input value={form.endpoint} onChange={(event) => onChange({ ...form, endpoint: event.target.value })} required={form.transportType !== "STDIO"} /></Field>
      <Field label="启动命令" description="仅 STDIO 使用，命令必须命中后端可执行文件白名单。"><Input value={form.commandLine ?? ""} onChange={(event) => onChange({ ...form, commandLine: event.target.value || null })} required={form.transportType === "STDIO"} /></Field>
      {form.transportType === "STDIO" ? <Alert tone="error">STDIO 会在服务器进程中执行命令。只配置经过审核且已加入白名单的可执行文件。</Alert> : null}
    </>
  );

  return (
    <Panel title={editing ? "服务配置" : "新增 MCP 服务"} eyebrow={editing ? "Configuration" : "Create"}>
      {editing ? (
        <div className="form-grid">{fields}<Switch label="启用服务" description="停用后服务不会参与工具调用。" checked={form.active} onChange={(event) => onChange({ ...form, active: event.target.checked })} /><div className="cluster"><Button type="button" variant="primary" loading={submitting} onClick={onUpdate}>保存配置</Button><Button type="button" variant="danger" disabled={submitting} onClick={onDelete}>删除配置</Button></div></div>
      ) : (
        <form className="form-grid" onSubmit={onCreate}>{fields}<Button type="submit" variant="primary" loading={submitting} fullWidth>创建服务</Button></form>
      )}
    </Panel>
  );
}
