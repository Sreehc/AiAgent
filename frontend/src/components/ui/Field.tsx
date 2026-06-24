import { ReactNode } from "react";

type FieldProps = {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
