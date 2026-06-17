import { ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

export type TabItem<T extends string> = { id: T; label: ReactNode };

type TabsProps<T extends string> = {
  ariaLabel: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ ariaLabel, items, value, onChange }: TabsProps<T>) {
  return (
    <RadixTabs.Root value={value} onValueChange={(next) => onChange(next as T)}>
      <RadixTabs.List
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.id}
            value={item.id}
            className="rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
