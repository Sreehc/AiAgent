import { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

type DialogProps = {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Dialog({ isOpen, title, description, children, footer, onClose }: DialogProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[40] bg-foreground/40 backdrop-blur-sm" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-[50] flex w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-lg focus:outline-none">
          <header className="flex flex-col gap-1">
            <RadixDialog.Title className="text-lg font-semibold text-foreground">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-sm text-muted-foreground">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </header>
          <div className="flex flex-col gap-3 text-sm text-foreground">{children}</div>
          {footer ? <footer className="flex flex-wrap items-center justify-end gap-2">{footer}</footer> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
