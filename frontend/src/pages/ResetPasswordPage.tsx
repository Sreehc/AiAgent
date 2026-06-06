import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, ApiError } from "../services/api";

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
      await apiRequest<void>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword, confirmPassword })
      });
      setSuccess("密码已重置，请返回登录页使用新密码登录。");
    } catch (requestError) {
      setError((requestError as ApiError).message || "密码重置失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <p className="eyebrow">Password Reset</p>
        <h1>重置密码</h1>
        <p className="muted">输入找回密码流程收到的重置令牌，并设置新的登录密码。</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            重置令牌
            <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="reset_xxx" />
          </label>
          <label>
            新密码
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="至少 8 位" />
          </label>
          <label>
            确认新密码
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="再次输入新密码" />
          </label>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
          {success ? <p className="form-message form-message--success">{success}</p> : null}
          <button type="submit" disabled={submitting}>{submitting ? "提交中..." : "重置密码"}</button>
        </form>
        <p className="auth-footer">
          <Link to="/login">返回登录</Link>
        </p>
      </div>
    </div>
  );
}
