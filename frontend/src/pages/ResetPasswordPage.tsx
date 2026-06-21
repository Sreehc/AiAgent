import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Field, Input } from "../components/ui";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";
import { AuthLayout } from "../features/auth/AuthLayout";

export function ResetPasswordPage() {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致。");
      setSubmitting(false);
      return;
    }
    if (newPassword.length < 8) {
      setError("密码至少需要 8 位。");
      setSubmitting(false);
      return;
    }
    try {
      await authApi.resetPassword({ resetToken, newPassword, confirmPassword });
      setSuccess("密码已重置，请返回登录页使用新密码登录。");
    } catch (requestError) {
      setError((requestError as ApiError).message || "密码重置失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Password reset" title="重置密码" intro="输入找回密码流程收到的重置令牌，并设置新的登录密码。" contextTitle="Reset Credentials" contextDescription="设置新的登录密码后，可以继续访问原有工作台数据。" footer={<Link to="/login">返回登录</Link>}>
        <form className="auth-form" onSubmit={onSubmit}>
          <Field label="重置令牌"><Input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="reset_xxx" required /></Field>
          <Field label="新密码"><Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="至少 8 位" required /></Field>
          <Field label="确认新密码"><Input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="再次输入新密码" required /></Field>
          {error ? <Alert tone="error" title="重置失败">{error}</Alert> : null}
          {success ? <Alert tone="success" title="密码已重置">{success}</Alert> : null}
          <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting || Boolean(success)} fullWidth>重置密码</Button>
        </form>
    </AuthLayout>
  );
}
