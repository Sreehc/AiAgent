import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, EmptyState, Field, Input } from "../components/ui";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";
import { AuthLayout } from "../features/auth/AuthLayout";

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
      await authApi.forgotPassword(usernameOrEmail);
      setMessage("如果账号存在，系统已生成重置流程。开发环境可直接使用重置令牌页面完成新密码设置。");
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Password reset" title="找回密码" intro="输入用户名或邮箱，系统会记录找回密码请求。" contextTitle="Account Recovery" contextDescription="找回流程只处理账号访问，不改变已有会话、知识库或产物归属。" footer={<Link to="/login">返回登录</Link>}>
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="用户名或邮箱"><Input value={usernameOrEmail} onChange={(event) => setUsernameOrEmail(event.target.value)} placeholder="alice / alice@example.com" /></Field>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        <EmptyState message={<span>已经拿到重置令牌？ <Link to="/reset-password">前往重置密码</Link></span>} />
        <Button type="submit" variant="primary" loading={submitting} fullWidth>发起找回</Button>
      </form>
    </AuthLayout>
  );
}
