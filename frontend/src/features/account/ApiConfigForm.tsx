import { FormEvent } from "react";
import { AccountApiConfigTestResult, AccountApiConfigUpdate } from "../../services/accountApi";
import { Alert, Button, Field, Input, Panel } from "../../components/ui";

type ApiConfigFormProps = {
  config: AccountApiConfigUpdate;
  apiKeyMasked: string | null;
  configured: boolean;
  saving: boolean;
  message: string | null;
  error: string | null;
  onChange: (config: AccountApiConfigUpdate) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTest: (modelType: AccountApiConfigTestResult["modelType"]) => void;
};

export function ApiConfigForm({ config, apiKeyMasked, configured, saving, message, error, onChange, onSubmit, onTest }: ApiConfigFormProps) {
  return (
    <Panel title="个人 API 配置" eyebrow="AI service" description="配置个人研究任务使用的 OpenAI-compatible 服务。">
      <form className="form-grid" onSubmit={onSubmit}>
        {error ? <Alert tone="error">{error}</Alert> : null}{message ? <Alert tone="success">{message}</Alert> : null}
        <Field label="API Base URL"><Input type="url" value={config.baseUrl} onChange={(event) => onChange({ ...config, baseUrl: event.target.value })} required /></Field>
        <Field label="API Key" description={configured ? `已保存 ${apiKeyMasked ?? "密钥"}，留空则保留原密钥。` : "输入后将加密保存到服务器。"}><Input type="password" value={config.apiKey} onChange={(event) => onChange({ ...config, apiKey: event.target.value })} placeholder={configured ? "留空以保留原密钥" : "sk-..."} required={!configured} /></Field>
        <Field label="默认模型"><Input value={config.model} onChange={(event) => onChange({ ...config, model: event.target.value })} placeholder="gpt-4o" required /></Field>
        <div className="form-row"><Field label="Temperature"><Input type="number" step="0.1" min="0" max="2" value={config.temperature} onChange={(event) => onChange({ ...config, temperature: Number.parseFloat(event.target.value) })} /></Field><Field label="最大 Tokens"><Input type="number" step="100" min="100" max="32000" value={config.maxTokens} onChange={(event) => onChange({ ...config, maxTokens: Number.parseInt(event.target.value, 10) })} /></Field></div>
        <div className="cluster">
          <Button type="button" variant="secondary" disabled={saving || !configured} onClick={() => onTest("CHAT")}>测试 Chat</Button>
          <Button type="button" variant="secondary" disabled={saving || !configured} onClick={() => onTest("EMBEDDING")}>测试 Embedding</Button>
          <Button type="button" variant="secondary" disabled={saving || !configured} onClick={() => onTest("IMAGE")}>测试 Image</Button>
          <Button type="submit" variant="primary" loading={saving}>保存配置</Button>
        </div>
      </form>
    </Panel>
  );
}
