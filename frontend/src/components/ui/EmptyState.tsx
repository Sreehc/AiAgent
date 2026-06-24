import { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const emptyStateVariants = cva("flex flex-col gap-2 rounded-md border border-dashed px-6 py-8 text-center", {
  variants: {
    variant: {
      plain: "border-border bg-transparent text-muted-foreground",
      permission: "border-warning/35 bg-warning/10 text-warning",
      "no-results": "border-info/30 bg-info/10 text-info",
      "first-run": "border-primary/30 bg-primary/10 text-primary"
    },
    align: {
      center: "items-center",
      start: "items-start text-left"
    }
  },
  defaultVariants: {
    variant: "plain",
    align: "center"
  }
});

type EmptyStateProps = {
  title?: string;
  message: ReactNode;
  variant?: "plain" | "permission" | "no-results" | "first-run";
  align?: "center" | "start";
  icon?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({ title, message, icon, action, secondaryAction, variant = "plain", align = "center", className }: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ variant, align }), className)}>
      {icon ? <div className="mb-1 text-current" aria-hidden="true">{icon}</div> : null}
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      <p className="max-w-prose text-sm text-muted-foreground">{message}</p>
      {action || secondaryAction ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{action}{secondaryAction}</div> : null}
    </div>
  );
}
