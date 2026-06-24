import { FormEvent } from "react";
import { AccountProfile } from "../../services/accountApi";
import { Alert, Button, Field, Input, Panel } from "../../components/ui";

type ProfileFormProps = {
  profile: AccountProfile;
  saving: boolean;
  success: string | null;
  error: string | null;
  onChange: (profile: AccountProfile) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProfileForm({ profile, saving, success, error, onChange, onSubmit }: ProfileFormProps) {
  return (
    <Panel className="account-profile-card" title="个人资料" eyebrow="Profile">
      <form className="form-grid" onSubmit={onSubmit}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        <Field label="用户名"><Input value={profile.username} disabled /></Field>
        <Field label="显示名称"><Input value={profile.displayName} onChange={(event) => onChange({ ...profile, displayName: event.target.value })} required /></Field>
        <Field label="邮箱"><Input type="email" value={profile.email ?? ""} onChange={(event) => onChange({ ...profile, email: event.target.value })} /></Field>
        <Field label="手机号"><Input value={profile.phone ?? ""} onChange={(event) => onChange({ ...profile, phone: event.target.value })} /></Field>
        <Button type="submit" variant="primary" loading={saving}>保存资料</Button>
      </form>
    </Panel>
  );
}
