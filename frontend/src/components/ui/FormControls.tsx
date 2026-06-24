import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { Children, InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export { FileInput } from "./FileInput";

const fieldBase =
  "w-full rounded-md border border-input bg-card text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10 px-3", className)} {...props} />;
}

type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange"> & {
  children: ReactNode;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
};

export function Select({ className, children, value, defaultValue, onChange, name, disabled, required, ...props }: SelectProps) {
  const options = normalizeSelectOptions(children);
  const selectedValue = typeof value === "string" ? value : undefined;
  const fallbackValue = typeof defaultValue === "string" ? defaultValue : undefined;
  const resolvedValue = selectedValue ?? fallbackValue ?? options[0]?.value ?? "";
  const selectedOption = options.find((option) => option.value === resolvedValue);

  function handleValueChange(nextValue: string) {
    onChange?.({ target: { value: nextValue, name } });
  }

  return (
    <RadixSelect.Root value={resolvedValue} onValueChange={handleValueChange} disabled={disabled} name={name}>
      <RadixSelect.Trigger
        className={cn(fieldBase, "select-trigger h-10 px-3", className)}
        aria-required={required || undefined}
      >
        <RadixSelect.Value>{selectedOption?.label ?? null}</RadixSelect.Value>
        <RadixSelect.Icon className="select-icon">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="select-content"
        >
          <RadixSelect.Viewport className="select-viewport">
            {options.map((option) => (
              <RadixSelect.Item key={option.value} value={option.value} disabled={option.disabled} className="select-item">
                <span className="select-item__indicator">
                  <RadixSelect.ItemIndicator>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[2.5rem] px-3 py-2 leading-relaxed", className)} {...props} />;
}

function normalizeSelectOptions(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!isOptionElement(child)) return [];
    const option = child as ReactElement<{ value?: string; disabled?: boolean; children?: ReactNode }>;
    const value = option.props.value == null ? String(option.props.children ?? "") : String(option.props.value);
    return [{
      value,
      label: option.props.children,
      disabled: Boolean(option.props.disabled)
    }] satisfies SelectOption[];
  });
}

function isOptionElement(child: ReactNode): child is ReactElement<{ value?: string; disabled?: boolean; children?: ReactNode }> {
  if (child == null || typeof child !== "object") {
    return false;
  }
  return "type" in child && child.type === "option";
}
