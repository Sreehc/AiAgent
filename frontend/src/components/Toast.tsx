import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

let listeners: ((toasts: ToastMessage[]) => void)[] = [];
let store: ToastMessage[] = [];

function emit() {
  listeners.forEach((listener) => listener([...store]));
}

export function showToast(type: ToastType, message: string, duration = 3200) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  store = [...store.slice(-3), { id, type, message }];
  emit();
  if (duration > 0) {
    window.setTimeout(() => dismissToast(id), duration);
  }
}

export function dismissToast(id: string) {
  store = store.filter((toast) => toast.id !== id);
  emit();
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners = [...listeners, setToasts];
    return () => {
      listeners = listeners.filter((listener) => listener !== setToasts);
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
          <span className="toast__message">{toast.message}</span>
          <button type="button" className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="关闭通知">
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
