import { InputHTMLAttributes } from "react";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function Switch({ label, description, className = "", ...props }: SwitchProps) {
  return (
    <label className={["switch", className].filter(Boolean).join(" ")}>
      <input type="checkbox" role="switch" {...props} />
      <span className="switch__control" aria-hidden="true" />
      <span className="switch__copy"><strong>{label}</strong>{description ? <small>{description}</small> : null}</span>
    </label>
  );
}
