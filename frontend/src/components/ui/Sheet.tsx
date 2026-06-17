import { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
};

export function Sheet({ isOpen, onClose, title, side = "left", children }: SheetProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[40] bg-foreground/40 backdrop-blur-sm" />
        <RadixDialog.Content
          className={`fixed inset-y-0 z-[50] flex w-[80vw] max-w-xs flex-col gap-4 border-border bg-card p-4 shadow-lg focus:outline-none ${
            side === "left" ? "left-0 border-r" : "right-0 border-l"
          }`}
        >
          <RadixDialog.Title className={title ? "text-base font-semibold text-foreground" : "sr-only"}>
            {title ?? "导航"}
          </RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
