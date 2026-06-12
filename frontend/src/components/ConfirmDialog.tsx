import { ReactNode } from "react";
import { Button, Dialog } from "./ui";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  danger = false
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <div className="confirm-dialog__message">{message}</div>
    </Dialog>
  );
}
