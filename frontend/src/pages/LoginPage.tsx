import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Field, Input } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";

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
      const result = await authApi.login({ username, password });
      setSession(result);
      const next = (location.state as { from?: string } | null)?.from ?? "/workspace/chat";
      navigate(next, { replace: true });
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card form-grid" onSubmit={onSubmit}>
        <div>
          <p className="eyebrow">AiAgent</p>
          <h2>登录工作台</h2>
          <p className="auth-card__intro">使用邀请注册创建的账号进入研究工作台。</p>
        </div>
        <Field label="用户名">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" placeholder="alice" />
        </Field>
        <Field label="密码">
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="输入密码" />
        </Field>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" variant="primary" loading={submitting} fullWidth>进入工作台</Button>
        <div className="auth-links">
          <Link to="/register/invite">邀请注册</Link>
          <Link to="/forgot-password">找回密码</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-context">
        <span className="app-brand__mark">AI</span>
        <h1>AI Agent Operations Console</h1>
        <p>用于发起研究任务、追踪执行计划、管理知识库和复用产物的工作台。</p>
        <div className="auth-points">
          <div className="auth-point"><strong>Research</strong><span>会话、执行流和报告产物</span></div>
          <div className="auth-point"><strong>Knowledge</strong><span>私有文档索引和检索测试</span></div>
          <div className="auth-point"><strong>Control</strong><span>模型、MCP 和账号配置</span></div>
        </div>
      </section>
      {children}
    </main>
  );
}
