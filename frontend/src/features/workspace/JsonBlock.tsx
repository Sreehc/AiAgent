import { ReactNode } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type JsonBlockProps = {
  payload?: unknown;
  label?: string;
  summary?: ReactNode;
  className?: string;
};

type NormalizedPayload = {
  displayPayload: string | null;
  parsed: unknown | null;
  parseError: boolean;
  fallbackSummary: string;
};

export function JsonBlock({ payload, label = "查看数据", summary, className }: JsonBlockProps) {
  const { displayPayload, parseError, fallbackSummary } = normalizePayload(payload);

  if (!displayPayload) {
    return (
      <div className={cn("json-block json-block--empty surface-inset px-3 py-2 text-xs text-muted-foreground", className)} role="status">
        <span className="font-medium text-foreground">{label}</span>
        <span className="ml-2">暂无详情数据</span>
      </div>
    );
  }

  return (
    <details className={cn("json-block group rounded-md border border-border bg-muted/40", className)}>
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
        <span className="min-w-0 truncate text-foreground">{label}</span>
        <span className="json-block__summary ml-auto min-w-0 truncate font-normal text-muted-foreground">
          {summary ?? fallbackSummary}
        </span>
      </summary>
      {parseError ? (
        <div className="flex items-start gap-2 border-t border-border px-3 py-2 text-xs text-warning" role="note">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>结构化解析失败，显示原始字符串。</span>
        </div>
      ) : null}
      <pre className="surface-inset max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-t-none border-x-0 border-b-0 px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
        {displayPayload}
      </pre>
    </details>
  );
}

function normalizePayload(payload: unknown): NormalizedPayload {
  if (payload == null) {
    return { displayPayload: null, parsed: null, parseError: false, fallbackSummary: "0 bytes" };
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) {
      return { displayPayload: null, parsed: null, parseError: false, fallbackSummary: "0 bytes" };
    }

    const parsedResult = parseMaybeJson(trimmed);
    if (parsedResult.ok) {
      const parsed = parsedResult.value;
      const displayPayload = JSON.stringify(parsed, null, 2);
      return {
        displayPayload,
        parsed,
        parseError: false,
        fallbackSummary: summarizePayload(displayPayload, parsed, false)
      };
    }

    return {
      displayPayload: trimmed,
      parsed: null,
      parseError: parsedResult.parseError,
      fallbackSummary: summarizePayload(trimmed, null, parsedResult.parseError)
    };
  }

  try {
    const displayPayload = JSON.stringify(payload, null, 2);
    return {
      displayPayload,
      parsed: payload,
      parseError: false,
      fallbackSummary: summarizePayload(displayPayload, payload, false)
    };
  } catch {
    const displayPayload = String(payload);
    return {
      displayPayload,
      parsed: null,
      parseError: false,
      fallbackSummary: summarizePayload(displayPayload, null, false)
    };
  }
}

function parseMaybeJson(value: string): { ok: true; value: unknown } | { ok: false; parseError: boolean } {
  const looksStructured = value.startsWith("{") || value.startsWith("[");
  if (!looksStructured) {
    return { ok: false, parseError: false };
  }

  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, parseError: true };
  }
}

function summarizePayload(displayPayload: string, parsed: unknown, parseError: boolean) {
  if (parseError) {
    return "结构化解析失败";
  }

  if (Array.isArray(parsed)) {
    return `${parsed.length} items`;
  }

  if (parsed && typeof parsed === "object") {
    const fieldCount = Object.keys(parsed).length;
    return `${fieldCount} fields`;
  }

  return `${displayPayload.length} chars`;
}
