import { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-[11px] font-medium leading-none tracking-normal",
  {
    variants: {
      tone: {
        primary: "border-primary/20 bg-primary/10 text-primary",
        neutral: "border-border bg-muted text-muted-foreground",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        danger: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-info/20 bg-info/10 text-info"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    children: ReactNode;
  };

export function Badge({ tone, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {children}
    </span>
  );
}
