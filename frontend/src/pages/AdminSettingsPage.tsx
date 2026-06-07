import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, Panel, Select, StatusPill } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest, ApiError, InviteItem, ModelConfigItem } from "../services/api";

type ModelType = "CHAT" | "EMBEDDING" | "IMAGE";

const DEFAULT_MODEL_FORM = {
  modelCode: "gpt-4o-mini",
  name: "OpenAI GPT-4o Mini",
  provider: "openai-compatible",
  modelType: "CHAT" as ModelType,
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  enabled: true
};

export function AdminSettingsPage() {
  const { session } = useAuthSession();
  const [models, setModels] = useState<ModelConfigItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [modelForm, setModelForm] = useState(DEFAULT_MODEL_FORM);
  const [inviteDays, setInviteDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submittingModel, setSubmittingModel] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadData();
  }, [session?.accessToken]);

  async function loadData() {
    if (!session?.accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [modelItems, inviteItems] = await Promise.all([
        apiRequest<ModelConfigItem[]>("/admin/models", {}, session.accessToken),
        apiRequest<InviteItem[]>("/admin/invites?limit=10", {}, session.accessToken)
      ]);
      setModels(modelItems);
      setInvites(inviteItems);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setSubmittingModel(true);
    setError(null);
    try {
      await apiRequest<ModelConfigItem>("/admin/models", { method: "POST", body: JSON.stringify(modelForm) }, session.accessToken);
      setModelForm(DEFAULT_MODEL_FORM);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmittingModel(false);
    }
  }

  async function onCreateInvite() {
    if (!session?.accessToken) {
      return;
    }
    setSubmittingInvite(true);
    setError(null);
    try {
      await apiRequest<InviteItem>("/admin/invites", { method: "POST", body: JSON.stringify({ expiresInDays: inviteDays }) }, session.accessToken);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmittingInvite(false);
    }
  }

  function copyInviteToken(token: string) {
    void navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token);
      window.setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  if (!session?.user.roles.includes("ADMIN")) {
    return <AdminDenied title="模型配置" />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>模型配置</h1>
        <div className="page-header__meta">
          <span className="badge badge--neutral">{models.filter((model) => model.enabled).length} 个启用</span>
          <span className="badge badge--neutral">{invites.length} 个邀请码</span>
        </div>
        <span className="badge">{loading ? "加载中" : `${models.length} models / ${invites.length} invites`}</span>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-grid content-grid--wide-side">
        <aside className="stack">
          <Panel title="新增模型" eyebrow="Models">
            <form className="form-grid" onSubmit={onCreateModel}>
              <Field label="模型代码"><Input value={modelForm.modelCode} onChange={(event) => setModelForm((current) => ({ ...current, modelCode: event.target.value }))} /></Field>
              <Field label="名称"><Input value={modelForm.name} onChange={(event) => setModelForm((current) => ({ ...current, name: event.target.value }))} /></Field>
              <Field label="服务商"><Input value={modelForm.provider} onChange={(event) => setModelForm((current) => ({ ...current, provider: event.target.value }))} /></Field>
              <div className="form-row">
                <Field label="模型类型"><Select value={modelForm.modelType} onChange={(event) => setModelForm((current) => ({ ...current, modelType: event.target.value as ModelType }))}><option value="CHAT">CHAT</option><option value="EMBEDDING">EMBEDDING</option><option value="IMAGE">IMAGE</option></Select></Field>
                <Field label="状态"><Select value={modelForm.enabled ? "true" : "false"} onChange={(event) => setModelForm((current) => ({ ...current, enabled: event.target.value === "true" }))}><option value="true">启用</option><option value="false">停用</option></Select></Field>
              </div>
              <Field label="API 地址"><Input value={modelForm.baseUrl} onChange={(event) => setModelForm((current) => ({ ...current, baseUrl: event.target.value }))} /></Field>
              <Field label="API Key" description="仅创建或轮换时填写，列表展示脱敏值。"><Input type="password" value={modelForm.apiKey} onChange={(event) => setModelForm((current) => ({ ...current, apiKey: event.target.value }))} /></Field>
              <Button type="submit" variant="primary" loading={submittingModel} fullWidth>创建模型</Button>
            </form>
          </Panel>
          <Panel title="创建邀请码" eyebrow="Invites">
            <div className="form-grid">
              <Field label="过期天数"><Input type="number" min={1} max={365} value={inviteDays} onChange={(event) => setInviteDays(Number(event.target.value) || 1)} /></Field>
              <Button type="button" variant="primary" loading={submittingInvite} onClick={() => void onCreateInvite()} fullWidth>生成邀请码</Button>
            </div>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title="模型列表" eyebrow="Registry" action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadData()}>刷新</Button>}>
            <div className="table-list">
              {models.map((model) => (
                <article key={model.id ?? `${model.modelType}-${model.modelCode}`} className="table-row">
                  <div><strong>{model.name}</strong><br /><small>{model.modelCode} · {model.provider}</small></div>
                  <div><code>{model.baseUrl}</code><br /><small>API Key: {model.apiKeyMasked ?? "未设置"}</small></div>
                  <StatusPill status={model.enabled ? "ACTIVE" : "INACTIVE"} label={`${model.modelType} · ${model.enabled ? "启用" : "停用"}`} />
                </article>
              ))}
            </div>
            {!loading && models.length === 0 ? <EmptyState message="还没有模型配置，先录入一个聊天模型或嵌入模型。" /> : null}
          </Panel>
          <Panel title="最近邀请码" eyebrow="Invites" action={<span className="badge">{invites.length} 条</span>}>
            <div className="table-list">
              {invites.map((invite) => (
                <article key={`${invite.inviteToken}-${invite.createdAt}`} className="table-row">
                  <div><strong className="mono">{invite.inviteToken}</strong><br /><small>过期：{formatDateTime(invite.expiresAt)}</small></div>
                  <StatusPill status={invite.status} />
                  <Button type="button" variant="secondary" size="sm" onClick={() => copyInviteToken(invite.inviteToken)}>{copiedToken === invite.inviteToken ? "已复制" : "复制"}</Button>
                </article>
              ))}
            </div>
            {!loading && invites.length === 0 ? <EmptyState message="还没有新生成的邀请码。" /> : null}
          </Panel>
        </main>
      </div>
    </section>
  );
}

function AdminDenied({ title }: { title: string }) {
  return (
    <section className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <span className="badge badge--neutral">Admin only</span>
      </header>
      <EmptyState message="当前账号没有管理员权限，无法访问该页面。" />
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
