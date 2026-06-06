import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, ApiError } from "../services/api";

export function ForgotPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await apiRequest<void>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ usernameOrEmail })
      });
      setMessage("如果账号存在，系统已生成重置流程。开发环境可直接使用重置令牌页面完成新密码设置。");
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Password Reset</p>
        <h1>找回密码</h1>
        <p className="muted">输入用户名或邮箱，系统会记录找回密码请求。</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            用户名或邮箱
            <input
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              type="text"
              placeholder="alice / alice@example.com"
            />
          </label>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
          {message ? <p className="form-message form-message--success">{message}</p> : null}
          <div className="workspace-empty-block">
            <p>如果你已经拿到重置令牌，可以直接前往重置密码页提交新密码。</p>
            <p><Link to="/reset-password">前往重置密码</Link></p>
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "提交中..." : "发起找回"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">返回登录</Link>
        </p>
      </div>
    </div>
  );
}

