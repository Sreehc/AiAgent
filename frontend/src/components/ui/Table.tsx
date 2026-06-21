import {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

type TableAlign = "left" | "center" | "right";

type TableProps = HTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
  density?: "default" | "compact";
  minWidth?: string | number;
};

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean;
  disabled?: boolean;
  expanded?: boolean;
};

type TableCellOptions = {
  align?: TableAlign;
  numeric?: boolean;
  status?: boolean;
};

type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & TableCellOptions;
type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & TableCellOptions;

const alignClasses: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

function tableCellClassName({
  align = "left",
  numeric = false,
  status = false,
  className
}: TableCellOptions & { className?: string }) {
  return cn(
    alignClasses[align],
    numeric && "text-right font-mono tabular-nums",
    status && "w-px whitespace-nowrap",
    className
  );
}

export function Table({ className, containerClassName, density = "default", minWidth = "720px", style, ...props }: TableProps) {
  return (
    <div className={cn("table-scroll", containerClassName)}>
      <table
        className={cn(
          "w-full caption-bottom border-separate border-spacing-0 text-sm",
          density === "compact" && "text-xs",
          className
        )}
        style={{ ...style, minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-muted/35 [&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, selected = false, disabled = false, expanded = false, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "group border-b border-border/70 transition-colors hover:bg-muted/40 data-[expanded=true]:bg-muted/30 data-[selected=true]:bg-accent data-[selected=true]:shadow-[inset_3px_0_0_hsl(var(--primary))] data-[disabled=true]:opacity-60",
        className
      )}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-expanded={expanded || undefined}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      {...props}
    />
  );
}

export function TableHead({ className, align = "left", numeric = false, status = false, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-10 px-3 align-middle text-xs font-semibold tracking-normal text-muted-foreground",
        tableCellClassName({ align, numeric, status, className })
      )}
      {...props}
    />
  );
}

export function TableCell({ className, align = "left", numeric = false, status = false, ...props }: TableCellProps) {
  return (
    <td
      className={cn("px-3 py-2.5 align-middle text-foreground", tableCellClassName({ align, numeric, status, className }))}
      {...props}
    />
  );
}

export function TableLoading({ columns, rows = 4, label = "正在加载表格数据" }: { columns: number; rows?: number; label?: string }) {
  return (
    <TableBody aria-busy="true" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <TableCell key={columnIndex}>
              <span className="table-skeleton-bar" style={{ width: `${Math.max(36, 88 - columnIndex * 12)}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan}>
          <div className="table-state">{children}</div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function TableError({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan}>
          <div className="table-state table-state--error" role="alert">{children}</div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function TableExpandedRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow expanded>
      <TableCell colSpan={colSpan} className="bg-muted/20 p-3">
        <div className="surface-inset max-h-[420px] overflow-auto p-4">{children}</div>
      </TableCell>
    </TableRow>
  );
}
