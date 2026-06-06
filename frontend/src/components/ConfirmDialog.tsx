import { ReactNode, useEffect } from "react";

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
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? "confirm-dialog__confirm--danger" : "confirm-dialog__confirm"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}