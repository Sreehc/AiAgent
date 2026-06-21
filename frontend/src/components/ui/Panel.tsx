import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const panelVariants = cva("flex min-w-0 flex-col rounded-md", {
  variants: {
    variant: {
      default: "border border-border bg-card shadow-none",
      plain: "bg-transparent shadow-none",
      subtle: "border border-border/80 bg-muted/40 shadow-none",
      raised: "border border-border bg-popover shadow-md",
      empty: "border border-dashed border-border bg-muted/30 shadow-none"
    },
    state: {
      default: "",
      loading: "is-loading",
      empty: "is-empty",
      error: "is-error border-destructive/30"
    }
  },
  defaultVariants: {
    variant: "default",
    state: "default"
  }
});

const panelHeaderVariants = cva("flex items-start justify-between gap-4 border-b border-border/70", {
  variants: {
    padded: {
      true: "px-5 py-4",
      false: ""
    }
  }
});

const panelBodyVariants = cva("flex min-w-0 flex-col gap-4", {
  variants: {
    padded: {
      true: "p-5",
      false: ""
    },
    state: {
      default: "",
      loading: "",
      empty: "",
      error: "rounded-b-md bg-destructive/5"
    }
  },
  defaultVariants: {
    state: "default"
  }
});

const panelFooterVariants = cva("border-t border-border/70", {
  variants: {
    padded: {
      true: "px-5 py-3",
      false: ""
    }
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
  state?: "default" | "loading" | "empty" | "error";
};

export function Panel({
  title,
  eyebrow,
  description,
  action,
  children,
  footer,
  variant = "default",
  state = "default",
  className
}: PanelProps) {
  const padded = variant !== "plain";
  return (
    <section
      className={cn(panelVariants({ variant, state }), className)}
      data-state={state}
      aria-busy={state === "loading" || undefined}
      role={state === "error" ? "alert" : undefined}
    >
      {title || eyebrow || description || action ? (
        <div className={cn(panelHeaderVariants({ padded }))}>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
            ) : null}
            {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="panel-action-wrap flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(panelBodyVariants({ padded, state }))}>{children}</div>
      {footer ? <div className={cn(panelFooterVariants({ padded }))}>{footer}</div> : null}
    </section>
  );
}
