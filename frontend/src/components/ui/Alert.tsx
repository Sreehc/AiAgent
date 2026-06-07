import { ReactNode } from "react";

type AlertProps = {
  tone?: "info" | "success" | "error";
  children: ReactNode;
};

export function Alert({ tone = "info", children }: AlertProps) {
  return <p className={`alert alert--${tone}`}>{children}</p>;
}
