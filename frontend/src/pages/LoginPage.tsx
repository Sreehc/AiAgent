import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Field, Input } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";
import { AuthLayout } from "../features/auth/AuthLayout";

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
    <AuthLayout eyebrow="Secure workspace" title="登录工作台" intro="使用邀请注册创建的账号进入研究工作台。" contextTitle="AI Agent Operations Console" contextDescription="用于发起研究任务、追踪执行计划、管理知识库和复用产物的工作台。" showCapabilities footer={<><Link to="/register/invite">邀请注册</Link><Link to="/forgot-password">找回密码</Link></>}>
      <form className="auth-form" onSubmit={onSubmit}>
        <Field label="用户名">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" placeholder="alice" required />
        </Field>
        <Field label="密码">
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="输入密码" required />
        </Field>
        {error ? <Alert tone="error" title="登录失败">{error}</Alert> : null}
        <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth>进入工作台</Button>
      </form>
    </AuthLayout>
  );
}
