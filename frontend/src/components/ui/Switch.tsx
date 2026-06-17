import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function Switch({ label, description, className, ...props }: SwitchProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span
          aria-hidden="true"
          className="h-5 w-9 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform peer-checked:translate-x-4"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <strong className="text-sm font-medium text-foreground">{label}</strong>
        {description ? <small className="text-xs text-muted-foreground">{description}</small> : null}
      </span>
    </label>
  );
}
