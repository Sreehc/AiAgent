import { ReactNode } from "react";

type FieldProps = {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {description ? <span className="field__description">{description}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
