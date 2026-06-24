import { ChangeEvent, InputHTMLAttributes, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  fileName?: string | null;
  placeholder?: string;
  triggerLabel?: string;
  clearKey?: string | number | null;
};

export function FileInput({
  className,
  fileName,
  placeholder = "未选择任何文件",
  triggerLabel = "选择文件",
  disabled,
  id,
  onChange,
  clearKey,
  ...props
}: FileInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div className={cn("file-input", disabled && "file-input--disabled", className)} data-clear-key={clearKey ?? undefined}>
      <input
        {...props}
        ref={inputRef}
        id={inputId}
        type="file"
        disabled={disabled}
        onChange={handleChange}
        className="file-input__native sr-only"
      />
      <div className="file-input__surface" aria-disabled={disabled || undefined}>
        <button type="button" className="file-input__trigger" onClick={openPicker} disabled={disabled} aria-controls={inputId}>
          {triggerLabel}
        </button>
        <span className={cn("file-input__value", !fileName && "file-input__value--placeholder")} title={fileName ?? placeholder}>
          {fileName ?? placeholder}
        </span>
      </div>
    </div>
  );
}
