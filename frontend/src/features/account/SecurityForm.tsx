import { FormEvent } from "react";
import { Alert, Button, Field, Input, Panel } from "../../components/ui";

type SecurityFormProps = {
  saving: boolean;
  message: string | null;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SecurityForm({ saving, message, error, onSubmit }: SecurityFormProps) {
  return (
    <Panel title="修改密码" eyebrow="Security">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="旧密码"><Input name="oldPassword" type="password" autoComplete="current-password" required /></Field>
        <Field label="新密码"><Input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
        {error ? <Alert tone="error">{error}</Alert> : null}{message ? <Alert tone="success">{message}</Alert> : null}
        <Button type="submit" variant="primary" loading={saving}>更新密码</Button>
      </form>
    </Panel>
  );
}
