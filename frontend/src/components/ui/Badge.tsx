import { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = "primary", className = "", children, ...props }: BadgeProps) {
  const classes = ["badge", tone !== "primary" ? `badge--${tone}` : "", className].filter(Boolean).join(" ");
  return <span className={classes} {...props}>{children}</span>;
}
