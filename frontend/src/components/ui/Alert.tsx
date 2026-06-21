import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-md border px-4 py-3 text-sm", {
  variants: {
    tone: {
      info: "border-info/30 bg-info/10 text-info",
      success: "border-success/30 bg-success/10 text-success",
      warning: "border-warning/30 bg-warning/10 text-warning",
      error: "border-destructive/30 bg-destructive/10 text-destructive"
    }
  },
  defaultVariants: {
    tone: "info"
  }
});

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle
};

type AlertProps = VariantProps<typeof alertVariants> & {
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  children: ReactNode;
};

export function Alert({ tone = "info", title, action, onDismiss, dismissLabel = "关闭提示", className, children }: AlertProps) {
  const Icon = alertIcons[tone ?? "info"];
  return (
    <div
      className={cn(alertVariants({ tone }), className)}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <Icon className="mt-0.5 h-4 w-4" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <strong className="block text-sm font-semibold leading-5">{title}</strong> : null}
        <div className={cn("leading-5", title && "mt-1")}>{children}</div>
        {action ? <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : <span aria-hidden="true" />}
    </div>
  );
}
