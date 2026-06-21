import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Alert, Badge, EmptyState } from "../components/ui";
import { ApiConfigForm } from "../features/account/ApiConfigForm";
import { LoginLogTable } from "../features/account/LoginLogTable";
import { ProfileForm } from "../features/account/ProfileForm";
import { SecurityForm, SecurityFormState } from "../features/account/SecurityForm";
import { useAuthSession } from "../hooks/useAuthSession";
import { AccountApiConfigTestResult, AccountApiConfigUpdate, AccountProfile, accountApi, LoginLogEntry } from "../services/accountApi";
import { ApiError } from "../services/api";

const DEFAULT_API_CONFIG: AccountApiConfigUpdate = { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o", temperature: 0.7, maxTokens: 2000 };

export function AccountPage() {
  const { session } = useAuthSession();
  const accessToken = session?.accessToken ?? null;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [apiConfig, setApiConfig] = useState(DEFAULT_API_CONFIG);
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<SecurityFormState>({ oldPassword: "", newPassword: "" });
  const [savingApiConfig, setSavingApiConfig] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiConfigMessage, setApiConfigMessage] = useState<string | null>(null);
  const [apiConfigError, setApiConfigError] = useState<string | null>(null);
  const [activeApiTest, setActiveApiTest] = useState<AccountApiConfigTestResult["modelType"] | null>(null);
  const [lastApiTestResult, setLastApiTestResult] = useState<AccountApiConfigTestResult | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([accountApi.getProfile(accessToken), accountApi.listLoginLogs(accessToken, 1, 5), accountApi.getApiConfig(accessToken)])
      .then(([profileResult, logResult, apiConfigResult]) => {
        setProfile(profileResult);
        setLogs(logResult.items);
        setApiConfig({ baseUrl: apiConfigResult.baseUrl, apiKey: "", model: apiConfigResult.model, temperature: apiConfigResult.temperature, maxTokens: apiConfigResult.maxTokens });
        setApiKeyMasked(apiConfigResult.apiKeyMasked);
        setApiConfigured(apiConfigResult.configured);
        setProfileError(null);
      })
      .catch((requestError: ApiError) => setProfileError(requestError.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !accessToken) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      setProfile(await accountApi.updateProfile(accessToken, { displayName: profile.displayName, email: profile.email, phone: profile.phone }));
      setProfileSuccess("资料已更新。");
    } catch (requestError) {
      setProfileError((requestError as ApiError).message || "资料更新失败。");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await accountApi.changePassword(accessToken, { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setPasswordMessage("密码已更新。");
    } catch (requestError) {
      setPasswordError((requestError as ApiError).message || "密码更新失败。");
    } finally {
      setSavingPassword(false);
    }
  }

  async function submitApiConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setSavingApiConfig(true);
    setApiConfigError(null);
    setApiConfigMessage(null);
    setLastApiTestResult(null);
    try {
      const updated = await accountApi.updateApiConfig(accessToken, apiConfig);
      setApiConfig({ baseUrl: updated.baseUrl, apiKey: "", model: updated.model, temperature: updated.temperature, maxTokens: updated.maxTokens });
      setApiKeyMasked(updated.apiKeyMasked);
      setApiConfigured(updated.configured);
      setApiConfigMessage("API 配置已保存。");
    } catch (requestError) {
      setApiConfigError((requestError as ApiError).message || "API 配置保存失败。");
    } finally {
      setSavingApiConfig(false);
    }
  }

  async function testApiConfig(modelType: AccountApiConfigTestResult["modelType"]) {
    if (!accessToken) return;
    setActiveApiTest(modelType);
    setApiConfigError(null);
    setApiConfigMessage(null);
    setLastApiTestResult(null);
    try {
      const result = await accountApi.testApiConfig(accessToken, modelType);
      setLastApiTestResult(result);
      if (result.status === "SUCCESS") {
        setApiConfigMessage(`${result.modelType}: ${result.message}`);
      } else {
        setApiConfigError(`${result.modelType}: ${result.message}`);
      }
    } catch (requestError) {
      setApiConfigError((requestError as ApiError).message || "连接测试失败。");
    } finally {
      setActiveApiTest(null);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>账号中心</h1>
          <p>维护个人资料、账号安全、个人 API 配置和登录审计记录。</p>
        </div>
        <div className="page-header__meta">
          <Badge tone="neutral">{logs.length} 条登录记录</Badge>
          <Badge tone="neutral">{profile?.roles.join(", ") ?? "账户"}</Badge>
          <Badge tone="success">登录态受保护</Badge>
        </div>
      </header>
      {loading ? <EmptyState message="账号信息加载中..." /> : null}
      {!loading && profile ? (
        <div className="stack-lg">
          {renderAccountSummary({ profile, apiConfigured, apiKeyMasked, logs })}
          {renderAccountStatusAlerts({ profileSuccess, profileError, passwordMessage, passwordError, apiConfigMessage, apiConfigError })}
          <nav className="account-section-nav" aria-label="账号中心分区">
            <a href="#account-api">个人 API</a>
            <a href="#account-profile">资料</a>
            <a href="#account-security">安全</a>
            <a href="#account-login-logs">登录日志</a>
          </nav>
          <div className="account-layout">
            <section id="account-api" className="account-layout__primary">
              <ApiConfigForm config={apiConfig} apiKeyMasked={apiKeyMasked} configured={apiConfigured} saving={savingApiConfig} testState={activeApiTest} lastTestResult={lastApiTestResult} message={apiConfigMessage} error={apiConfigError} onChange={setApiConfig} onSubmit={submitApiConfig} onTest={testApiConfig} />
            </section>
            <aside className="account-layout__side">
              <section id="account-profile"><ProfileForm profile={profile} saving={savingProfile} success={profileSuccess} error={profileError} onChange={setProfile} onSubmit={submitProfile} /></section>
              <section id="account-security"><SecurityForm form={passwordForm} saving={savingPassword} message={passwordMessage} error={passwordError} onChange={setPasswordForm} onSubmit={submitPassword} /></section>
            </aside>
          </div>
          <section id="account-login-logs"><LoginLogTable logs={logs} /></section>
        </div>
      ) : null}
    </section>
  );
}

function renderAccountSummary({
  profile,
  apiConfigured,
  apiKeyMasked,
  logs
}: {
  profile: AccountProfile;
  apiConfigured: boolean;
  apiKeyMasked: string | null;
  logs: LoginLogEntry[];
}) {
  const latestLog = logs[0];
  return (
    <div className="account-summary-grid">
      <SummaryCard label="账号" value={profile.displayName || profile.username} helper={profile.username} />
      <SummaryCard label="角色" value={profile.roles.join(", ") || "USER"} helper="当前会话权限" />
      <SummaryCard label="个人 API" value={apiConfigured ? "已配置" : "未配置"} helper={apiConfigured ? apiKeyMasked ?? "密钥已保存" : "运行个人模型前需配置"} tone={apiConfigured ? "success" : "warning"} />
      <SummaryCard label="最近登录" value={latestLog ? latestLog.loginIp : "-"} helper={latestLog ? formatAccountDate(latestLog.loginAt) : "暂无记录"} />
    </div>
  );
}

function renderAccountStatusAlerts({
  profileSuccess,
  profileError,
  passwordMessage,
  passwordError,
  apiConfigMessage,
  apiConfigError
}: {
  profileSuccess: string | null;
  profileError: string | null;
  passwordMessage: string | null;
  passwordError: string | null;
  apiConfigMessage: string | null;
  apiConfigError: string | null;
}) {
  const alerts = [
    profileError ? { tone: "error" as const, title: "资料保存失败", message: profileError } : null,
    passwordError ? { tone: "error" as const, title: "安全设置失败", message: passwordError } : null,
    apiConfigError ? { tone: "error" as const, title: "API 配置失败", message: apiConfigError } : null,
    profileSuccess ? { tone: "success" as const, title: "资料已保存", message: profileSuccess } : null,
    passwordMessage ? { tone: "success" as const, title: "密码已更新", message: passwordMessage } : null,
    apiConfigMessage ? { tone: "success" as const, title: "API 状态", message: apiConfigMessage } : null
  ].filter(Boolean) as Array<{ tone: "error" | "success"; title: string; message: string }>;

  if (alerts.length === 0) return null;

  return (
    <div className="account-status-alerts">
      {alerts.map((alert) => <Alert key={`${alert.title}-${alert.message}`} tone={alert.tone} title={alert.title}>{alert.message}</Alert>)}
    </div>
  );
}

function SummaryCard({ label, value, helper, tone = "neutral" }: { label: string; value: ReactNode; helper: string; tone?: "neutral" | "success" | "warning" }) {
  return (
    <article className="account-summary-card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function formatAccountDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}
