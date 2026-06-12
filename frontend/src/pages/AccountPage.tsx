import { FormEvent, useEffect, useState } from "react";
import { Alert, EmptyState, StatusPill } from "../components/ui";
import { ApiConfigForm } from "../features/account/ApiConfigForm";
import { LoginLogTable } from "../features/account/LoginLogTable";
import { ProfileForm } from "../features/account/ProfileForm";
import { SecurityForm } from "../features/account/SecurityForm";
import { useAuthSession } from "../hooks/useAuthSession";
import { AccountApiConfig, AccountProfile, accountApi, LoginLogEntry } from "../services/accountApi";
import { ApiError } from "../services/api";

const DEFAULT_API_CONFIG: AccountApiConfig = { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4", temperature: 0.7, maxTokens: 2000 };

export function AccountPage() {
  const { session } = useAuthSession();
  const accessToken = session?.accessToken ?? null;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [apiConfig, setApiConfig] = useState(DEFAULT_API_CONFIG);
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
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
    void Promise.all([accountApi.getProfile(accessToken), accountApi.listLoginLogs(accessToken, 1, 5), accountApi.getApiConfig(accessToken).catch(() => null)])
      .then(([profileResult, logResult, apiConfigResult]) => {
        setProfile(profileResult);
        setLogs(logResult.items);
        if (apiConfigResult) setApiConfig(apiConfigResult);
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
    const form = new FormData(event.currentTarget);
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await accountApi.changePassword(accessToken, { oldPassword: form.get("oldPassword"), newPassword: form.get("newPassword") });
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
    if (!accessToken) return;
    setSavingApiConfig(true);
    setApiConfigError(null);
    setApiConfigMessage(null);
    try {
      await accountApi.updateApiConfig(accessToken, apiConfig);
      setApiConfigMessage("API 配置已保存。");
    } catch (requestError) {
      setApiConfigError((requestError as ApiError).message || "API 配置保存失败。");
    } finally {
      setSavingApiConfig(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>账号中心</h1><p>维护个人资料、账号安全、个人 API 配置和登录审计记录。</p></div><div className="page-header__meta"><span className="badge badge--neutral">{logs.length} 条登录记录</span><span className="badge badge--neutral">{profile?.roles.join(", ") ?? "账户"}</span></div><StatusPill status="ACTIVE" label="登录态受保护" /></header>
      {profileError ? <Alert tone="error">{profileError}</Alert> : null}
      {loading ? <EmptyState message="账号信息加载中..." /> : null}
      {!loading && profile ? <div className="stack-lg"><ApiConfigForm config={apiConfig} saving={savingApiConfig} message={apiConfigMessage} error={apiConfigError} onChange={setApiConfig} onSubmit={submitApiConfig} /><div className="content-grid content-grid--two"><ProfileForm profile={profile} saving={savingProfile} success={profileSuccess} onChange={setProfile} onSubmit={submitProfile} /><SecurityForm saving={savingPassword} message={passwordMessage} error={passwordError} onSubmit={submitPassword} /></div><LoginLogTable logs={logs} /></div> : null}
    </section>
  );
}
