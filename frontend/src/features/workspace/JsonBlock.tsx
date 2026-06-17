type JsonBlockProps = {
  payload: string;
  label?: string;
};

export function JsonBlock({ payload, label = "查看数据" }: JsonBlockProps) {
  return (
    <details className="group rounded-md border border-border bg-muted/40">
      <summary className="cursor-pointer select-none px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        {label}
      </summary>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-border px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
        {payload}
      </pre>
    </details>
  );
}
