import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, EmptyState, Field, Input } from "../components/ui";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";
import { AuthLayout } from "../features/auth/AuthLayout";

type RegisterForm = {
  inviteToken: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({ inviteToken: "", username: "", displayName: "", password: "", confirmPassword: "" });
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
      await authApi.registerByInvite(form);
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
    <AuthLayout eyebrow="Invite register" title="创建受邀账号" intro="输入管理员发放的邀请码，创建可访问工作台的账号。" contextTitle="Controlled Access Workspace" contextDescription="邀请注册和登录态保护确保会话、知识库和产物默认归属个人账号。" footer={<>已有账号？<Link to="/login">返回登录</Link></>}>
      {inviteInvalid ? <EmptyState message="当前邀请码无效、已过期或已被使用，请联系管理员重新生成邀请码。" /> : null}
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="邀请码"><Input value={form.inviteToken} onChange={(event) => setForm((current) => ({ ...current, inviteToken: event.target.value }))} placeholder="INVITE-ABC" /></Field>
        <div className="form-row">
          <Field label="用户名"><Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="alice" /></Field>
          <Field label="显示名称"><Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Alice" /></Field>
        </div>
        <div className="form-row">
          <Field label="密码"><Input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} type="password" placeholder="至少 8 位" /></Field>
          <Field label="确认密码"><Input value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} type="password" placeholder="再次输入密码" /></Field>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        <Button type="submit" variant="primary" loading={submitting} fullWidth>创建账号</Button>
      </form>
    </AuthLayout>
  );
}
