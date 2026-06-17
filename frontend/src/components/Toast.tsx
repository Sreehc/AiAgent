import { toast, Toaster } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

export function showToast(type: ToastType, message: string, duration = 3200) {
  const options = duration > 0 ? { duration } : {};
  switch (type) {
    case "success":
      toast.success(message, options);
      return;
    case "error":
      toast.error(message, options);
      return;
    case "warning":
      toast.warning(message, options);
      return;
    default:
      toast(message, options);
  }
}

export function dismissToast(id?: string | number) {
  toast.dismiss(id);
}

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-md border border-border bg-card text-foreground shadow-md"
        }
      }}
    />
  );
}
