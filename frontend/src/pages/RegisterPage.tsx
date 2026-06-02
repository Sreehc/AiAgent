import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "../services/api";

type RegisterForm = {
  inviteToken: string;
  username: string;
  displayName: string;
  password: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    inviteToken: "INVITE-ABC",
    username: "",
    displayName: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest<void>("/auth/register-by-invite", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setSuccess("注册成功，2 秒后跳转到登录页。");
      window.setTimeout(() => navigate("/login"), 2000);
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <p className="eyebrow">Invite Register</p>
        <h1>邀请注册</h1>
        <p className="muted">
          默认预置邀请码是 <code>INVITE-ABC</code>，后续管理员可以在配置页生成新邀请码。
        </p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            邀请码
            <input
              value={form.inviteToken}
              onChange={(event) =>
                setForm((current) => ({ ...current, inviteToken: event.target.value }))
              }
              type="text"
              placeholder="INVITE-ABC"
            />
          </label>
          <label>
            用户名
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              type="text"
              placeholder="alice"
            />
          </label>
          <label>
            显示名称
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({ ...current, displayName: event.target.value }))
              }
              type="text"
              placeholder="Alice"
            />
          </label>
          <label>
            密码
            <input
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              type="password"
              placeholder="至少 8 位"
            />
          </label>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
          {success ? <p className="form-message form-message--success">{success}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "注册中..." : "创建账号"}
          </button>
        </form>
        <p className="auth-footer">
          已有账号？<Link to="/login">返回登录</Link>
        </p>
      </div>
    </div>
  );
}

