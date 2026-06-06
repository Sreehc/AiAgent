import { FormEvent, useEffect, useState } from "react";
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
      await apiRequest<ModelConfigItem>(
        "/admin/models",
        {
          method: "POST",
          body: JSON.stringify(modelForm)
        },
        session.accessToken
      );
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
      await apiRequest<InviteItem>(
        "/admin/invites",
        {
          method: "POST",
          body: JSON.stringify({
            expiresInDays: inviteDays
          })
        },
        session.accessToken
      );
      await loadData();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmittingInvite(false);
    }
  }

  if (!session?.user.roles.includes("ADMIN")) {
    return (
      <section className="workspace">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Admin Only</p>
            <h2>基础配置页</h2>
          </div>
        </header>
        <div className="workspace__panel workspace-empty-block">
          <p>当前账号没有管理员权限，无法访问基础配置页。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">管理控制台</p>
          <h2>基础配置页</h2>
        </div>
        <span className="badge">{loading ? "加载中" : `${models.length} 个模型 / ${invites.length} 个邀请码`}</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>新增模型配置</h3>
            <form className="workspace-form" onSubmit={onCreateModel}>
              <label>
                模型代码
                <input
                  value={modelForm.modelCode}
                  onChange={(event) => setModelForm((current) => ({ ...current, modelCode: event.target.value }))}
                />
              </label>
              <label>
                名称
                <input
                  value={modelForm.name}
                  onChange={(event) => setModelForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                服务商
                <input
                  value={modelForm.provider}
                  onChange={(event) => setModelForm((current) => ({ ...current, provider: event.target.value }))}
                />
              </label>
              <div className="workspace-form__row">
                <label>
                  模型类型
                  <select
                    value={modelForm.modelType}
                    onChange={(event) =>
                      setModelForm((current) => ({ ...current, modelType: event.target.value as ModelType }))
                    }
                  >
                    <option value="CHAT">CHAT</option>
                    <option value="EMBEDDING">EMBEDDING</option>
                    <option value="IMAGE">IMAGE</option>
                  </select>
                </label>
                <label>
                  启用状态
                  <select
                    value={modelForm.enabled ? "true" : "false"}
                    onChange={(event) =>
                      setModelForm((current) => ({ ...current, enabled: event.target.value === "true" }))
                    }
                  >
                    <option value="true">启用</option>
                    <option value="false">停用</option>
                  </select>
                </label>
              </div>
              <label>
                API 地址
                <input
                  value={modelForm.baseUrl}
                  onChange={(event) => setModelForm((current) => ({ ...current, baseUrl: event.target.value }))}
                />
              </label>
              <label>
                API Key
                <input
                  type="password"
                  value={modelForm.apiKey}
                  onChange={(event) => setModelForm((current) => ({ ...current, apiKey: event.target.value }))}
                  placeholder="仅创建/轮换时填写，列表只展示脱敏值"
                />
              </label>
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button type="submit" disabled={submittingModel}>
                {submittingModel ? "提交中..." : "创建模型"}
              </button>
            </form>
          </div>

          <div className="workspace-sidebar__section">
            <h3>创建邀请码</h3>
            <div className="workspace-form">
              <label>
                过期天数
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={inviteDays}
                  onChange={(event) => setInviteDays(Number(event.target.value) || 1)}
                />
              </label>
              <button type="button" disabled={submittingInvite} onClick={() => void onCreateInvite()}>
                {submittingInvite ? "创建中..." : "生成邀请码"}
              </button>
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">模型</p>
                <h3>模型配置列表</h3>
              </div>
              <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadData()}>
                刷新
              </button>
            </div>
            <div className="plan-list">
              {models.map((model) => (
                <article key={model.id ?? `${model.modelType}-${model.modelCode}`} className="plan-card">
                  <div className="plan-card__header">
                    <strong>{model.name}</strong>
                    <span>{model.enabled ? "已启用" : "已停用"}</span>
                  </div>
                  <p>{model.modelCode} · {model.modelType === "CHAT" ? "聊天" : model.modelType === "EMBEDDING" ? "嵌入" : model.modelType === "IMAGE" ? "图像" : model.modelType} · {model.provider}</p>
                  <p className="muted">{model.baseUrl}</p>
                  <p className="muted">API Key: {model.apiKeyMasked ?? "未设置"}</p>
                </article>
              ))}
              {!loading && models.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有模型配置，先录入一个聊天模型或嵌入模型。</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">邀请码</p>
                <h3>最近邀请码</h3>
              </div>
              <span className="muted">{invites.length} 条</span>
            </div>
            <div className="event-list">
              {invites.map((invite) => (
                <article key={`${invite.inviteToken}-${invite.createdAt}`} className="event-card">
                  <div className="event-card__header">
                    <strong>{invite.inviteToken}</strong>
                    <small>{invite.status === "ACTIVE" ? "可用" : invite.status === "USED" ? "已使用" : invite.status === "EXPIRED" ? "已过期" : invite.status}</small>
                  </div>
                  <p className="muted">创建时间：{formatDateTime(invite.createdAt)}</p>
                  <p className="muted">过期时间：{formatDateTime(invite.expiresAt)}</p>
                </article>
              ))}
              {!loading && invites.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有新生成的邀请码。</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">关联管理入口</p>
                <h3>联动入口</h3>
              </div>
            </div>
            <div className="workspace-empty-block">
              <p>MCP 工具源配置已在独立页面维护；本页负责模型配置与邀请码管理，收拢管理员基础配置能力。</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
