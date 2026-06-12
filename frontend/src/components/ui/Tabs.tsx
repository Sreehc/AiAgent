import { KeyboardEvent, ReactNode } from "react";

export type TabItem<T extends string> = { id: T; label: ReactNode };

type TabsProps<T extends string> = {
  ariaLabel: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ ariaLabel, items, value, onChange }: TabsProps<T>) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    onChange(items[nextIndex].id);
  }

  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <button key={item.id} type="button" role="tab" aria-selected={item.id === value} tabIndex={item.id === value ? 0 : -1} className={`tabs__item ${item.id === value ? "tabs__item--active" : ""}`} onClick={() => onChange(item.id)} onKeyDown={(event) => onKeyDown(event, index)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
