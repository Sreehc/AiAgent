import { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  message: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-8 text-center">
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-1 flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
