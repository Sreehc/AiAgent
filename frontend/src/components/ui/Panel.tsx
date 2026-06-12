import { ReactNode } from "react";

type PanelProps = {
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "plain" | "subtle" | "raised";
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
  className = ""
}: PanelProps) {
  const classes = [
    "panel",
    variant === "plain" ? "panel--plain" : "",
    variant === "subtle" ? "panel--subtle" : "",
    variant === "raised" ? "panel--raised" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {(title || eyebrow || description || action) ? (
        <div className="panel__header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h3>{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action ? <div className="cluster">{action}</div> : null}
        </div>
      ) : null}
      <div className="panel__body">{children}</div>
      {footer ? <div className="panel__footer">{footer}</div> : null}
    </section>
  );
}
