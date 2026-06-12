import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Field, Input } from "../components/ui";
import { ApiError } from "../services/api";
import { authApi } from "../services/authApi";

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
    <main className="auth-page">
      <section className="auth-context">
        <span className="app-brand__mark">AI</span>
        <h1>Reset Credentials</h1>
        <p>设置新的登录密码后，可以继续访问原有工作台数据。</p>
      </section>
      <section className="auth-card">
        <p className="eyebrow">Password Reset</p>
        <h2>重置密码</h2>
        <p className="auth-card__intro">输入找回密码流程收到的重置令牌，并设置新的登录密码。</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <Field label="重置令牌"><Input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="reset_xxx" /></Field>
          <Field label="新密码"><Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="至少 8 位" /></Field>
          <Field label="确认新密码"><Input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="再次输入新密码" /></Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}
          <Button type="submit" variant="primary" loading={submitting} fullWidth>重置密码</Button>
        </form>
        <p className="auth-footer"><Link to="/login">返回登录</Link></p>
      </section>
    </main>
  );
}
