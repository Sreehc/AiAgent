import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "../services/api";

type RegisterForm = {
  inviteToken: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    inviteToken: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [inviteInvalid, setInviteInvalid] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInviteInvalid(false);
    setSuccess(null);

    if (form.password.length < 8) {
      setError("密码至少需要 8 位。");
      setSubmitting(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致。");
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest<void>("/auth/register-by-invite", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setSuccess("注册成功，2 秒后跳转到登录页。");
      window.setTimeout(() => navigate("/login"), 2000);
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setInviteInvalid(apiError.code === "INVITE_INVALID" || apiError.code === "INVITE_EXPIRED");
      setError(apiError.message || "注册失败，请稍后重试。");
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
          请输入管理员发放的邀请码完成注册。生产环境不会展示默认演示邀请码。
        </p>
        {inviteInvalid ? (
          <div className="workspace-empty-block">
            <p>当前邀请码无效、已过期或已被使用，请联系管理员重新生成邀请码。</p>
          </div>
        ) : null}
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
          <label>
            确认密码
            <input
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              type="password"
              placeholder="再次输入密码"
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

