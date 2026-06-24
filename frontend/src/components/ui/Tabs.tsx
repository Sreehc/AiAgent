import { ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = { id: T; label: ReactNode; disabled?: boolean };

const tabsListVariants = cva("inline-flex min-w-max items-center", {
  variants: {
    variant: {
      segmented: "gap-1 rounded-md border border-border bg-muted/40 p-1",
      underline: "gap-5 border-b border-border"
    }
  },
  defaultVariants: {
    variant: "segmented"
  }
});

const tabsTriggerVariants = cva(
  "relative inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=active]:text-foreground data-[state=active]:after:opacity-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        segmented: "hover:bg-background/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0",
        underline: "rounded-none px-0 hover:text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0"
      }
    },
    defaultVariants: {
      variant: "segmented"
    }
  }
);

type TabsProps<T extends string> = {
  ariaLabel: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  children?: ReactNode;
  variant?: "segmented" | "underline";
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

type TabsContentStateProps = {
  state?: "default" | "loading" | "empty" | "error";
  children: ReactNode;
  className?: string;
};

type TabsContentProps = RadixTabs.TabsContentProps & TabsContentStateProps;

export function Tabs<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  children,
  variant = "segmented",
  className,
  listClassName,
  triggerClassName,
  contentClassName
}: TabsProps<T>) {
  return (
    <RadixTabs.Root value={value} onValueChange={(next) => onChange(next as T)} className={className}>
      <div className={cn("tabs-scroll")}>
        <RadixTabs.List
          aria-label={ariaLabel}
          className={cn(tabsListVariants({ variant }), listClassName)}
        >
          {items.map((item) => (
            <RadixTabs.Trigger
              key={item.id}
              value={item.id}
              disabled={item.disabled}
              className={cn(tabsTriggerVariants({ variant }), triggerClassName)}
            >
              {item.label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
      </div>
      {children ? <div className={cn("mt-4", contentClassName)}>{children}</div> : null}
    </RadixTabs.Root>
  );
}

export function TabsContent({ value, state = "default", children, className, ...props }: TabsContentProps) {
  return (
    <RadixTabs.Content value={value} className={cn("mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props}>
      <TabsContentState state={state}>{children}</TabsContentState>
    </RadixTabs.Content>
  );
}

export function TabsContentState({ state = "default", children, className }: TabsContentStateProps) {
  return (
    <div
      className={cn("tabs-content-state", state === "error" && "tabs-content-state--error", className)}
      data-state={state}
      aria-busy={state === "loading" || undefined}
      role={state === "error" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}
