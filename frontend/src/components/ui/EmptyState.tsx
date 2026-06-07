import { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  message: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {title ? <h3>{title}</h3> : null}
      <p>{message}</p>
      {action ? <div className="cluster">{action}</div> : null}
    </div>
  );
}
