import { ReactNode } from "react";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

type DropdownMenuItem = {
  label: ReactNode;
  onSelect?: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function DropdownMenu({ trigger, items, align = "end", side = "bottom" }: DropdownMenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          side={side}
          sideOffset={6}
          className="z-[50] min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {items.map((item, index) => (
            <RadixMenu.Item
              key={index}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                "flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                item.tone === "danger" && "text-destructive data-[highlighted]:bg-destructive/10"
              )}
            >
              {item.label}
            </RadixMenu.Item>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
