import { FormEvent } from "react";
import { Alert, Button, Field, Input, Panel } from "../../components/ui";

export type SecurityFormState = {
  oldPassword: string;
  newPassword: string;
};

type SecurityFormProps = {
  form: SecurityFormState;
  saving: boolean;
  message: string | null;
  error: string | null;
  onChange: (form: SecurityFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SecurityForm({ form, saving, message, error, onChange, onSubmit }: SecurityFormProps) {
  return (
    <Panel title="修改密码" eyebrow="Security">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="旧密码">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={form.oldPassword}
            onChange={(event) => onChange({ ...form, oldPassword: event.target.value })}
          />
        </Field>
        <Field label="新密码">
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.newPassword}
            onChange={(event) => onChange({ ...form, newPassword: event.target.value })}
          />
        </Field>
        {error ? <Alert tone="error">{error}</Alert> : null}{message ? <Alert tone="success">{message}</Alert> : null}
        <Button type="submit" variant="primary" loading={saving}>更新密码</Button>
      </form>
    </Panel>
  );
}
