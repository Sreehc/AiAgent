import { FormEvent, useEffect, useState } from "react";
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
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void Promise.all([
      apiRequest<Profile>("/account/profile", {}, accessToken),
      apiRequest<LoginLogResponse>("/account/login-logs?pageNo=1&pageSize=5", {}, accessToken)
    ])
      .then(([profileResult, logResult]) => {
        setProfile(profileResult);
        setLogs(logResult.items);
        setProfileError(null);
      })
      .catch((requestError: ApiError) => {
        setProfileError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
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
      const updated = await apiRequest<Profile>(
        "/account/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            displayName: profile.displayName,
            email: profile.email,
            phone: profile.phone
          })
        },
        accessToken
      );
      setProfile(updated);
      setProfileSuccess("资料已更新。");
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setProfileError(apiError.message || "资料更新失败。");
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
      await apiRequest<void>(
        "/account/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            oldPassword: form.get("oldPassword"),
            newPassword: form.get("newPassword")
          })
        },
        accessToken
      );
      event.currentTarget.reset();
      setPasswordMessage("密码已更新。");
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setPasswordError(apiError.message || "密码更新失败。");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="account-page">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">账户中心</p>
          <h2>账号中心</h2>
        </div>
        <span className="badge">登录态受保护</span>
      </header>

      {profileError ? <p className="form-message form-message--error">{profileError}</p> : null}
      {profileSuccess ? <p className="form-message form-message--success">{profileSuccess}</p> : null}

      {loading ? (
        <div className="workspace__panel workspace-empty-block">
          <p>账号信息加载中...</p>
        </div>
      ) : null}

      {!loading && profile ? (
        <div className="account-grid">
          <form className="workspace__panel account-panel" onSubmit={submitProfile}>
            <h3>个人资料</h3>
            <label>
              用户名
              <input value={profile.username} disabled />
            </label>
            <label>
              显示名称
              <input
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) =>
                    current ? { ...current, displayName: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              邮箱
              <input
                value={profile.email ?? ""}
                onChange={(event) =>
                  setProfile((current) =>
                    current ? { ...current, email: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              手机号
              <input
                value={profile.phone ?? ""}
                onChange={(event) =>
                  setProfile((current) =>
                    current ? { ...current, phone: event.target.value } : current
                  )
                }
              />
            </label>
            <button type="submit" disabled={savingProfile}>{savingProfile ? "保存中..." : "保存资料"}</button>
          </form>

          <form className="workspace__panel account-panel" onSubmit={submitPassword}>
            <h3>修改密码</h3>
            <label>
              旧密码
              <input name="oldPassword" type="password" />
            </label>
            <label>
              新密码
              <input name="newPassword" type="password" />
            </label>
            {passwordError ? (
              <p className="form-message form-message--error">{passwordError}</p>
            ) : null}
            {passwordMessage ? (
              <p className="form-message form-message--success">{passwordMessage}</p>
            ) : null}
            <button type="submit" disabled={savingPassword}>{savingPassword ? "更新中..." : "更新密码"}</button>
          </form>

          <section className="workspace__panel account-panel account-panel--logs">
            <h3>最近登录日志</h3>
            <p className="muted">仅展示当前登录用户最近的访问记录。</p>
            <div className="log-list">
              {logs.map((log) => (
                <article key={`${log.loginAt}-${log.loginIp}`} className="log-item">
                  <strong>{log.loginResult}</strong>
                  <span>{log.loginIp}</span>
                  <span>{new Date(log.loginAt).toLocaleString()}</span>
                  <small>{log.userAgent}</small>
                </article>
              ))}
              {logs.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>暂无登录记录。</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

