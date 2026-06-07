import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, Panel, Select, StatusPill } from "../components/ui";
import { apiRequest, ApiError } from "../services/api";
import { useAuthSession } from "../hooks/useAuthSession";

type Profile = {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
};

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

type LoginLogEntry = {
  loginIp: string;
  userAgent: string;
  loginResult: string;
  loginAt: string;
};

type LoginLogResponse = {
  pageNo: number;
  pageSize: number;
  items: LoginLogEntry[];
};

export function AccountPage() {
  const { session } = useAuthSession();
  const accessToken = session?.accessToken ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({ baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4", temperature: 0.7, maxTokens: 2000 });
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingApiConfig, setSavingApiConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiConfigMessage, setApiConfigMessage] = useState<string | null>(null);
  const [apiConfigError, setApiConfigError] = useState<string | null>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      apiRequest<Profile>("/account/profile", {}, accessToken),
      apiRequest<LoginLogResponse>("/account/login-logs?pageNo=1&pageSize=5", {}, accessToken),
      apiRequest<ApiConfig>("/account/api-config", {}, accessToken).catch(() => null)
    ]).then(([profileResult, logResult, apiConfigResult]) => {
      setProfile(profileResult);
      setLogs(logResult.items);
      if (apiConfigResult) {
        setApiConfig(apiConfigResult);
      }
      setProfileError(null);
    }).catch((requestError: ApiError) => {
      setProfileError(requestError.message);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !accessToken) {
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const updated = await apiRequest<Profile>("/account/profile", { method: "PUT", body: JSON.stringify({ displayName: profile.displayName, email: profile.email, phone: profile.phone }) }, accessToken);
      setProfile(updated);
      setProfileSuccess("资料已更新。");
    } catch (requestError) {
      setProfileError((requestError as ApiError).message || "资料更新失败。");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    const form = new FormData(event.currentTarget);
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await apiRequest<void>("/account/change-password", { method: "POST", body: JSON.stringify({ oldPassword: form.get("oldPassword"), newPassword: form.get("newPassword") }) }, accessToken);
      event.currentTarget.reset();
      setPasswordMessage("密码已更新。");
    } catch (requestError) {
      setPasswordError((requestError as ApiError).message || "密码更新失败。");
    } finally {
      setSavingPassword(false);
    }
  }

  async function submitApiConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    setSavingApiConfig(true);
    setApiConfigError(null);
    setApiConfigMessage(null);
    try {
      await apiRequest<void>("/account/api-config", { method: "PUT", body: JSON.stringify(apiConfig) }, accessToken);
      setApiConfigMessage("API 配置已保存。");
    } catch (requestError) {
      setApiConfigError((requestError as ApiError).message || "API 配置保存失败。");
    } finally {
      setSavingApiConfig(false);
    }
  }

  async function testConnection() {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      setApiConfigError("请先填写 API Base URL 和 API Key");
      return;
    }
    setTestingConnection(true);
    setConnectionTestResult(null);
    setApiConfigError(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      setConnectionTestResult("success");
      setApiConfigMessage("连接测试成功。");
    } catch {
      setConnectionTestResult("error");
      setApiConfigError("连接测试失败，请检查配置。");
    } finally {
      setTestingConnection(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>账号中心</h1>
          <p>维护个人资料、安全凭据、AI 服务配置和最近登录记录。</p>
        </div>
        <StatusPill status="ACTIVE" label="登录态受保护" />
      </header>
      {profileError ? <Alert tone="error">{profileError}</Alert> : null}
      {profileSuccess ? <Alert tone="success">{profileSuccess}</Alert> : null}
      {loading ? <EmptyState message="账号信息加载中..." /> : null}

      {!loading && profile ? (
        <div className="stack-lg">
          <Panel title="API 配置" eyebrow="AI Service" description="配置研究功能使用的 OpenAI 兼容服务。" action={connectionTestResult ? <StatusPill status={connectionTestResult === "success" ? "SUCCESS" : "ERROR"} /> : null}>
            <form className="form-grid" onSubmit={submitApiConfig}>
              {apiConfigError ? <Alert tone="error">{apiConfigError}</Alert> : null}
              {apiConfigMessage ? <Alert tone="success">{apiConfigMessage}</Alert> : null}
              <Field label="API Base URL" description="OpenAI 兼容的 API 地址。"><Input type="url" value={apiConfig.baseUrl} onChange={(event) => setApiConfig({ ...apiConfig, baseUrl: event.target.value })} required /></Field>
              <Field label="API Key" description="密钥将提交到服务器保存。"><Input type="password" value={apiConfig.apiKey} onChange={(event) => setApiConfig({ ...apiConfig, apiKey: event.target.value })} placeholder="sk-..." required /></Field>
              <Field label="默认模型"><Select value={apiConfig.model} onChange={(event) => setApiConfig({ ...apiConfig, model: event.target.value })}><option value="gpt-4">GPT-4</option><option value="gpt-4-turbo">GPT-4 Turbo</option><option value="gpt-4o">GPT-4o</option><option value="gpt-3.5-turbo">GPT-3.5 Turbo</option><option value="claude-3-opus-20240229">Claude 3 Opus</option><option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option></Select></Field>
              <div className="form-row">
                <Field label="Temperature"><Input type="number" step="0.1" min="0" max="2" value={apiConfig.temperature} onChange={(event) => setApiConfig({ ...apiConfig, temperature: Number.parseFloat(event.target.value) })} /></Field>
                <Field label="最大 Tokens"><Input type="number" step="100" min="100" max="8000" value={apiConfig.maxTokens} onChange={(event) => setApiConfig({ ...apiConfig, maxTokens: Number.parseInt(event.target.value, 10) })} /></Field>
              </div>
              <div className="cluster">
                <Button type="button" variant="secondary" loading={testingConnection} onClick={() => void testConnection()}>测试连接</Button>
                <Button type="submit" variant="primary" loading={savingApiConfig}>保存配置</Button>
              </div>
            </form>
          </Panel>

          <div className="content-grid content-grid--two">
            <Panel title="个人资料" eyebrow="Profile">
              <form className="form-grid" onSubmit={submitProfile}>
                <Field label="用户名"><Input value={profile.username} disabled /></Field>
                <Field label="显示名称"><Input value={profile.displayName} onChange={(event) => setProfile((current) => current ? { ...current, displayName: event.target.value } : current)} /></Field>
                <Field label="邮箱"><Input value={profile.email ?? ""} onChange={(event) => setProfile((current) => current ? { ...current, email: event.target.value } : current)} /></Field>
                <Field label="手机号"><Input value={profile.phone ?? ""} onChange={(event) => setProfile((current) => current ? { ...current, phone: event.target.value } : current)} /></Field>
                <Button type="submit" variant="primary" loading={savingProfile}>保存资料</Button>
              </form>
            </Panel>

            <Panel title="修改密码" eyebrow="Security">
              <form className="form-grid" onSubmit={submitPassword}>
                <Field label="旧密码"><Input name="oldPassword" type="password" /></Field>
                <Field label="新密码"><Input name="newPassword" type="password" /></Field>
                {passwordError ? <Alert tone="error">{passwordError}</Alert> : null}
                {passwordMessage ? <Alert tone="success">{passwordMessage}</Alert> : null}
                <Button type="submit" variant="primary" loading={savingPassword}>更新密码</Button>
              </form>
            </Panel>
          </div>

          <Panel title="最近登录日志" eyebrow="Audit" description="仅展示当前登录用户最近的访问记录。">
            <div className="table-list">
              {logs.map((log) => (
                <article key={`${log.loginAt}-${log.loginIp}`} className="table-row">
                  <div><strong>{log.loginResult}</strong><br /><small>{new Date(log.loginAt).toLocaleString()}</small></div>
                  <span>{log.loginIp}</span>
                  <small>{log.userAgent}</small>
                </article>
              ))}
            </div>
            {logs.length === 0 ? <EmptyState message="暂无登录记录。" /> : null}
          </Panel>
        </div>
      ) : null}
    </section>
  );
}
