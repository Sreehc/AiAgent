import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, Panel, StatusPill } from "../components/ui";
import { ModelForm } from "../features/system/ModelForm";
import { ModelRegistry } from "../features/system/ModelRegistry";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi, ModelConfigPayload } from "../services/adminApi";
import { ApiError, InviteItem, ModelConfigItem } from "../services/api";

const DEFAULT_MODEL_FORM: ModelConfigPayload = { modelCode: "gpt-4o-mini", name: "OpenAI GPT-4o Mini", provider: "openai-compatible", modelType: "CHAT", baseUrl: "https://api.openai.com/v1", apiKey: "", enabled: true };

export function AdminSettingsPage() {
  const { session } = useAuthSession();
  const [models, setModels] = useState<ModelConfigItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [modelForm, setModelForm] = useState(DEFAULT_MODEL_FORM);
  const [editingModelCode, setEditingModelCode] = useState<string | null>(null);
  const [inviteDays, setInviteDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submittingModel, setSubmittingModel] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) void loadData();
  }, [session?.accessToken]);

  async function loadData() {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [modelItems, inviteItems] = await Promise.all([adminApi.listModels(session.accessToken), adminApi.listInvites(session.accessToken, 10)]);
      setModels(modelItems);
      setInvites(inviteItems);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setSubmittingModel(true);
    setError(null);
    try {
      if (editingModelCode) {
        const { modelCode: _modelCode, ...payload } = modelForm;
        await adminApi.updateModel(session.accessToken, editingModelCode, payload);
      } else {
        await adminApi.createModel(session.accessToken, modelForm);
      }
      setModelForm(DEFAULT_MODEL_FORM);
      setEditingModelCode(null);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmittingModel(false);
    }
  }

  function onEditModel(model: ModelConfigItem) {
    setEditingModelCode(model.modelCode);
    setModelForm({
      modelCode: model.modelCode,
      name: model.name,
      provider: model.provider,
      modelType: model.modelType,
      baseUrl: model.baseUrl,
      apiKey: "",
      enabled: model.enabled
    });
  }

  async function onCreateInvite() {
    if (!session?.accessToken) return;
    setSubmittingInvite(true);
    setError(null);
    try {
      await adminApi.createInvite(session.accessToken, inviteDays);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function onToggleModel(model: ModelConfigItem) {
    if (!session?.accessToken) return;
    try {
      model.enabled ? await adminApi.disableModel(session.accessToken, model.modelCode) : await adminApi.enableModel(session.accessToken, model.modelCode);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onDeleteModel(model: ModelConfigItem) {
    if (!session?.accessToken) return;
    try {
      await adminApi.deleteModel(session.accessToken, model.modelCode);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onTestModel(model: ModelConfigItem) {
    if (!session?.accessToken) return;
    try {
      const result = await adminApi.testModel(session.accessToken, model.modelCode);
      setError(`${result.modelCode}: ${result.status} - ${result.message}`);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onDefaultModel(model: ModelConfigItem) {
    if (!session?.accessToken) return;
    try {
      await adminApi.setDefaultModel(session.accessToken, model.modelCode);
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  function copyInviteToken(token: string) {
    void navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token);
      window.setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  if (!session?.user.roles.includes("ADMIN")) return <AdminDenied />;

  return (
    <section className="page">
      <header className="page-header"><div><h1>模型配置</h1><p>管理 Chat、Embedding 和 Image 模型能力，以及工作台邀请码。</p></div><div className="page-header__meta"><span className="badge badge--neutral">{models.filter((model) => model.enabled).length} 个启用</span><span className="badge badge--neutral">{invites.length} 个邀请码</span></div><span className="badge">{loading ? "加载中" : `${models.length} models`}</span></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {models.some((model) => model.provider === "local-mock" && model.enabled) ? <Alert tone="error">检测到已启用的 local-mock provider。生产环境应停用该配置。</Alert> : null}
      <div className="content-grid content-grid--wide-side">
        <aside className="stack">
          <ModelForm form={modelForm} submitting={submittingModel} editing={editingModelCode !== null} onChange={setModelForm} onSubmit={onSubmitModel} onCancelEdit={() => { setEditingModelCode(null); setModelForm(DEFAULT_MODEL_FORM); }} />
          <Panel title="创建邀请码" eyebrow="Access"><div className="form-grid"><Field label="过期天数"><Input type="number" min={1} max={365} value={inviteDays} onChange={(event) => setInviteDays(Number(event.target.value) || 1)} /></Field><Button type="button" variant="primary" loading={submittingInvite} onClick={() => void onCreateInvite()} fullWidth>生成邀请码</Button></div></Panel>
        </aside>
        <main className="stack">
          <ModelRegistry models={models} loading={loading} onToggle={onToggleModel} onEdit={onEditModel} onDelete={onDeleteModel} onTest={onTestModel} onDefault={onDefaultModel} />
          <Panel title="最近邀请码" eyebrow="Invites" action={<span className="badge">{invites.length} 条</span>}><div className="table-list">{invites.map((invite) => <article key={`${invite.inviteToken}-${invite.createdAt}`} className="table-row"><div><strong className="mono">{invite.inviteToken}</strong><br /><small>过期：{formatDateTime(invite.expiresAt)}</small></div><StatusPill status={invite.status} /><Button type="button" variant="secondary" size="sm" onClick={() => copyInviteToken(invite.inviteToken)}>{copiedToken === invite.inviteToken ? "已复制" : "复制"}</Button></article>)}</div>{!loading && invites.length === 0 ? <EmptyState message="还没有新生成的邀请码。" /> : null}</Panel>
        </main>
      </div>
    </section>
  );
}

function AdminDenied() {
  return <section className="page"><header className="page-header"><h1>模型配置</h1><span className="badge badge--neutral">Admin only</span></header><EmptyState message="当前账号没有管理员权限，无法访问该页面。" /></section>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
