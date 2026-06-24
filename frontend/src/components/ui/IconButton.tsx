import { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-md border font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:active:scale-100 disabled:opacity-50",
  {
    variants: {
      tone: {
        default: "border-border bg-card text-foreground shadow-sm hover:border-border-strong hover:bg-muted",
        danger: "border-border bg-card text-destructive hover:border-destructive/30 hover:bg-destructive/10 focus-visible:ring-destructive/40"
      },
      size: {
        md: "h-10 w-10 min-h-10 min-w-10",
        lg: "h-11 w-11 min-h-11 min-w-11"
      }
    },
    defaultVariants: {
      tone: "default",
      size: "md"
    }
  }
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  loading?: boolean;
  size?: "md" | "lg";
  tone?: "default" | "danger";
} & VariantProps<typeof iconButtonVariants>;

export function IconButton({ label, children, loading = false, size = "md", tone = "default", className, disabled, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(iconButtonVariants({ tone, size }), className)}
      type="button"
      aria-label={label}
      aria-busy={loading || undefined}
      title={label}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center justify-center", loading && "opacity-0")}>{children}</span>
    </button>
  );
}
