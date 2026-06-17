import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const panelVariants = cva("flex flex-col rounded-lg", {
  variants: {
    variant: {
      default: "border border-border bg-card shadow-sm",
      plain: "",
      subtle: "border border-border bg-muted/40",
      raised: "border border-border bg-card shadow-md"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

type PanelProps = VariantProps<typeof panelVariants> & {
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Panel({
  title,
  eyebrow,
  description,
  action,
  children,
  footer,
  variant = "default",
  className
}: PanelProps) {
  const padded = variant !== "plain";
  return (
    <section className={cn(panelVariants({ variant }), className)}>
      {title || eyebrow || description || action ? (
        <div className={cn("flex items-start justify-between gap-4 border-b border-border", padded && "px-5 py-4")}>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
            ) : null}
            {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex flex-col gap-4", padded && "p-5")}>{children}</div>
      {footer ? <div className={cn("border-t border-border", padded && "px-5 py-3")}>{footer}</div> : null}
    </section>
  );
}
