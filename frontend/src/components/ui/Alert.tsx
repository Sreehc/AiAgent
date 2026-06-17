import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md border px-4 py-3 text-sm", {
  variants: {
    tone: {
      info: "border-info/30 bg-info/10 text-info",
      success: "border-success/30 bg-success/10 text-success",
      error: "border-destructive/30 bg-destructive/10 text-destructive"
    }
  },
  defaultVariants: {
    tone: "info"
  }
});

type AlertProps = VariantProps<typeof alertVariants> & {
  className?: string;
  children: ReactNode;
};

export function Alert({ tone = "info", className, children }: AlertProps) {
  return (
    <div className={cn(alertVariants({ tone }), className)} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
