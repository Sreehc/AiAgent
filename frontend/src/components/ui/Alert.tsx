import { ReactNode } from "react";

type AlertProps = {
  tone?: "info" | "success" | "error";
  children: ReactNode;
};

export function Alert({ tone = "info", children }: AlertProps) {
  return <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}
