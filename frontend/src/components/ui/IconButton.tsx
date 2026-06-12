import { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "default" | "danger";
};

export function IconButton({ label, children, tone = "default", className = "", ...props }: IconButtonProps) {
  const classes = ["icon-button", tone === "danger" ? "icon-button--danger" : "", className].filter(Boolean).join(" ");
  return <button className={classes} type="button" aria-label={label} title={label} {...props}>{children}</button>;
}
