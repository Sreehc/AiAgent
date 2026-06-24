import { FormEvent, useEffect, useState } from "react";
import { Alert, Badge, Button, EmptyState, Field, Input, Panel } from "../components/ui";
import { showToast } from "../components/Toast";
import { InviteCodePanel } from "../features/system/InviteCodePanel";
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
      showToast(result.status === "SUCCESS" ? "success" : "error", `${result.modelCode}: ${result.status} - ${result.message}`);
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

  const modelSummary = buildModelSummary(models);

  return (
    <section className="page">
      <header className="page-header"><div><h1>模型配置</h1><p>管理 Chat、Embedding 和 Image 模型能力，以及工作台邀请码。</p></div><div className="page-header__meta"><Badge tone={modelSummary.defaultModel ? "success" : "warning"}>{modelSummary.defaultModel ? "默认已设置" : "默认模型未设置"}</Badge><Badge tone={modelSummary.riskyModels.length > 0 ? "warning" : "success"}>{modelSummary.riskyModels.length} 个风险</Badge><Badge tone="neutral">{invites.length} 个邀请码</Badge></div><Badge>{loading ? "加载中" : `${models.length} models`}</Badge></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!loading && !modelSummary.defaultModel ? <Alert tone="warning">默认模型未设置。建议为运行时指定一个稳定的 Chat 模型，避免任务调度时选择不明确。</Alert> : null}
      {modelSummary.riskyModels.length > 0 ? <Alert tone="error" title="检测到模型风险配置">{modelSummary.riskyModels.length} 个启用模型使用 local-mock provider 或最近测试状态非 SUCCESS。请先处理生产风险，再开放给研究任务使用。</Alert> : null}
      <div className="model-settings-summary">
        <SummaryCard label="默认模型" value={modelSummary.defaultModel?.name ?? "未设置"} detail={modelSummary.defaultModel ? `${modelSummary.defaultModel.modelCode} · ${modelSummary.defaultModel.provider}` : "需要在注册表中设为默认"} tone={modelSummary.defaultModel ? "success" : "warning"} />
        <SummaryCard label="启用模型" value={`${modelSummary.enabledModels}/${models.length}`} detail={`Chat ${modelSummary.chatModels} · Embedding ${modelSummary.embeddingModels} · Image ${modelSummary.imageModels}`} tone="neutral" />
        <SummaryCard label="风险 provider" value={String(modelSummary.riskyModels.length)} detail={modelSummary.riskyModels.length > 0 ? "local-mock 或测试失败" : "未发现启用风险配置"} tone={modelSummary.riskyModels.length > 0 ? "danger" : "success"} />
        <SummaryCard label="测试状态" value={String(modelSummary.failedTests.length)} detail={modelSummary.failedTests.length > 0 ? "最近测试非 SUCCESS" : "最近测试无失败样本"} tone={modelSummary.failedTests.length > 0 ? "warning" : "success"} />
      </div>
      <div className="content-grid content-grid--wide-side">
        <aside className="stack">
          <ModelForm form={modelForm} submitting={submittingModel} editing={editingModelCode !== null} onChange={setModelForm} onSubmit={onSubmitModel} onCancelEdit={() => { setEditingModelCode(null); setModelForm(DEFAULT_MODEL_FORM); }} />
          <Panel title="创建邀请码" eyebrow="Access"><div className="form-grid"><Field label="过期天数"><Input type="number" min={1} max={365} value={inviteDays} onChange={(event) => setInviteDays(Number(event.target.value) || 1)} /></Field><Button type="button" variant="primary" loading={submittingInvite} onClick={() => void onCreateInvite()} fullWidth>生成邀请码</Button></div></Panel>
        </aside>
        <main className="stack">
          <ModelRegistry models={models} loading={loading} onToggle={onToggleModel} onEdit={onEditModel} onDelete={onDeleteModel} onTest={onTestModel} onDefault={onDefaultModel} />
          <InviteCodePanel invites={invites} loading={loading} copiedToken={copiedToken} onCopy={copyInviteToken} />
        </main>
      </div>
    </section>
  );
}

function AdminDenied() {
  return <section className="page"><header className="page-header"><h1>模型配置</h1><Badge tone="neutral">Admin only</Badge></header><EmptyState message="当前账号没有管理员权限，无法访问该页面。" /></section>;
}

function SummaryCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <div className="model-settings-summary__card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function buildModelSummary(models: ModelConfigItem[]) {
  const enabledModels = models.filter((model) => model.enabled);
  const defaultModel = models.find((model) => model.defaultModel) ?? null;
  const failedTests = models.filter((model) => model.riskCodes.includes("LAST_TEST_FAILED"));
  const riskyModels = models.filter((model) => model.riskLevel !== "default");

  return {
    defaultModel,
    enabledModels: enabledModels.length,
    chatModels: models.filter((model) => model.modelType === "CHAT").length,
    embeddingModels: models.filter((model) => model.modelType === "EMBEDDING").length,
    imageModels: models.filter((model) => model.modelType === "IMAGE").length,
    failedTests,
    riskyModels
  };
}
