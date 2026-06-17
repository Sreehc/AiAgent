import { FormEvent, useEffect, useState } from "react";
import { Alert, Badge, EmptyState, StatusPill } from "../components/ui";
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
    setSavingApiConfig(true);
    setApiConfigError(null);
    setApiConfigMessage(null);
    try {
      const result = await accountApi.testApiConfig(accessToken, modelType);
      if (result.status === "SUCCESS") {
        setApiConfigMessage(`${result.modelType}: ${result.message}`);
      } else {
        setApiConfigError(`${result.modelType}: ${result.message}`);
      }
    } catch (requestError) {
      setApiConfigError((requestError as ApiError).message || "连接测试失败。");
    } finally {
      setSavingApiConfig(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>账号中心</h1><p>维护个人资料、账号安全、个人 API 配置和登录审计记录。</p></div><div className="page-header__meta"><Badge tone="neutral">{logs.length} 条登录记录</Badge><Badge tone="neutral">{profile?.roles.join(", ") ?? "账户"}</Badge></div><StatusPill status="ACTIVE" label="登录态受保护" /></header>
      {profileError ? <Alert tone="error">{profileError}</Alert> : null}
      {loading ? <EmptyState message="账号信息加载中..." /> : null}
      {!loading && profile ? <div className="stack-lg"><ApiConfigForm config={apiConfig} apiKeyMasked={apiKeyMasked} configured={apiConfigured} saving={savingApiConfig} message={apiConfigMessage} error={apiConfigError} onChange={setApiConfig} onSubmit={submitApiConfig} onTest={testApiConfig} /><div className="content-grid content-grid--two"><ProfileForm profile={profile} saving={savingProfile} success={profileSuccess} onChange={setProfile} onSubmit={submitProfile} /><SecurityForm form={passwordForm} saving={savingPassword} message={passwordMessage} error={passwordError} onChange={setPasswordForm} onSubmit={submitPassword} /></div><LoginLogTable logs={logs} /></div> : null}
    </section>
  );
}
