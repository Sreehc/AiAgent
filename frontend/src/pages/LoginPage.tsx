import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest, ApiError } from "../services/api";

type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  user: {
    userId: string;
    username: string;
    displayName: string;
    roles: string[];
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setSession(result);
      const next = (location.state as { from?: string } | null)?.from ?? "/workspace/chat";
      navigate(next, { replace: true });
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
        <p className="eyebrow">AiAgent</p>
        <h1>登录工作台</h1>
        <p className="muted">
          使用邀请注册创建的账号登录。默认预置邀请码是 <code>INVITE-ABC</code>。
        </p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            用户名
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              placeholder="alice"
            />
          </label>
          <label>
            密码
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="******"
            />
          </label>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "登录中..." : "进入"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/register/invite">邀请注册</Link>
          <Link to="/forgot-password">找回密码</Link>
        </div>
      </div>
    </div>
  );
}
