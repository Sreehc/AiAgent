import { ButtonHTMLAttributes, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-[0.99] disabled:pointer-events-none disabled:active:translate-y-0 disabled:active:scale-100 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border border-border bg-card text-foreground shadow-sm hover:border-border-strong hover:bg-muted",
        ghost: "border border-transparent text-foreground hover:bg-muted",
        danger: "border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/40"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "md"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    children: ReactNode;
  };

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth,
  loading = false,
  className,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [loadingWidth, setLoadingWidth] = useState<number>();

  useLayoutEffect(() => {
    if (loading || !buttonRef.current) return;

    const width = buttonRef.current.getBoundingClientRect().width;
    if (width > 0) {
      setLoadingWidth((current) => (current && Math.abs(current - width) < 0.5 ? current : width));
    }
  });

  return (
    <button
      ref={buttonRef}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={loading && loadingWidth ? { ...style, minWidth: loadingWidth } : style}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      ) : null}
      <span className={cn("inline-flex min-w-0 items-center justify-center gap-2", loading && "opacity-0")}>{children}</span>
    </button>
  );
}
