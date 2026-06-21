import { ReactNode } from "react";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type DropdownMenuActionItem = {
  type?: "item";
  label: ReactNode;
  onSelect?: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  selected?: boolean;
  icon?: ReactNode;
  shortcut?: ReactNode;
};

type DropdownMenuSeparatorItem = {
  type: "separator";
};

type DropdownMenuGroupItem = {
  type: "group";
  label: ReactNode;
  items: DropdownMenuActionItem[];
};

type DropdownMenuItem = DropdownMenuActionItem | DropdownMenuSeparatorItem | DropdownMenuGroupItem;

type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function DropdownMenu({ trigger, items, align = "end", side = "bottom" }: DropdownMenuProps) {
  const hasItems = items.length > 0;

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
          {hasItems ? renderDropdownItems(items) : <DropdownMenuAction item={{ label: "暂无可用操作", disabled: true }} index={0} />}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

function renderDropdownItems(items: DropdownMenuItem[]) {
  return items.map((item, index) => {
    if (item.type === "separator") {
      return <RadixMenu.Separator key={index} className="my-1 h-px bg-border" />;
    }

    if (item.type === "group") {
      return (
        <RadixMenu.Group key={index}>
          <RadixMenu.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{item.label}</RadixMenu.Label>
          {item.items.length ? item.items.map((groupItem, groupIndex) => (
            <DropdownMenuAction key={groupIndex} item={groupItem} index={groupIndex} />
          )) : <DropdownMenuAction item={{ label: "暂无可用操作", disabled: true }} index={0} />}
        </RadixMenu.Group>
      );
    }

    return <DropdownMenuAction key={index} item={item} index={index} />;
  });
}

function DropdownMenuAction({ item }: { item: DropdownMenuActionItem; index: number }) {
  return (
    <RadixMenu.Item
      disabled={item.disabled}
      onSelect={item.onSelect}
      data-selected={item.selected || undefined}
      aria-current={item.selected ? "true" : undefined}
      className={cn(
        "grid min-h-10 sm:min-h-8 cursor-pointer select-none grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        item.tone === "danger" && "text-destructive data-[highlighted]:bg-destructive/10 data-[selected=true]:bg-destructive/10"
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {item.selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : item.icon}
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
      {item.shortcut ? <span className="text-xs text-muted-foreground">{item.shortcut}</span> : null}
    </RadixMenu.Item>
  );
}
