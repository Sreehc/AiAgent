import { Badge } from "./Badge";

type StatusPillProps = {
  status?: string | null;
  label?: string;
};

type StatusTone = "success" | "info" | "danger" | "warning" | "neutral" | "running";
type BadgeTone = "success" | "info" | "danger" | "warning" | "neutral";

const STATUS_CONFIG: Record<string, { tone: StatusTone; label: string }> = {
  IDLE: { tone: "neutral", label: "空闲" },
  PENDING: { tone: "info", label: "等待中" },
  RUNNING: { tone: "running", label: "执行中" },
  PROCESSING: { tone: "running", label: "处理中" },
  PAUSED: { tone: "warning", label: "已暂停" },
  CANCEL_REQUESTED: { tone: "warning", label: "取消中" },
  CANCELLED: { tone: "neutral", label: "已取消" },
  COMPLETED: { tone: "success", label: "已完成" },
  SUCCESS: { tone: "success", label: "成功" },
  ACTIVE: { tone: "success", label: "活跃" },
  HEALTHY: { tone: "success", label: "健康" },
  FAILED: { tone: "danger", label: "失败" },
  ERROR: { tone: "danger", label: "错误" },
  INACTIVE: { tone: "danger", label: "未激活" },
  UNHEALTHY: { tone: "danger", label: "异常" },
  EXPIRED: { tone: "danger", label: "已过期" },
  TIMED_OUT: { tone: "danger", label: "已超时" },
  WARNING: { tone: "warning", label: "需注意" },
  USED: { tone: "warning", label: "已使用" },
  SKIPPED: { tone: "warning", label: "已跳过" }
};

const UNKNOWN_CONFIG: { tone: StatusTone; label?: string } = { tone: "neutral" };

export function StatusPill({ status, label }: StatusPillProps) {
  const normalized = normalizeStatus(status);
  const config = STATUS_CONFIG[normalized] ?? UNKNOWN_CONFIG;
  const text = label ?? config.label ?? normalized;
  return (
    <Badge tone={badgeTone(config.tone)} className={`status-pill status-pill--${toStatusClass(normalized)} gap-1.5`} role="status" aria-label={text} data-status={normalized} data-tone={config.tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass(config.tone)}`} aria-hidden="true" />
      <span>{text}</span>
    </Badge>
  );
}

function normalizeStatus(status?: string | null) {
  return (status?.trim() || "UNKNOWN").toUpperCase();
}

function toStatusClass(status: string) {
  return status.toLowerCase().replaceAll("_", "-");
}

function badgeTone(tone: StatusTone): BadgeTone {
  return tone === "running" ? "info" : tone;
}

function dotClass(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-success";
    case "info":
      return "bg-info";
    case "running":
      return "bg-primary animate-pulse motion-reduce:animate-none";
    case "danger":
      return "bg-destructive";
    case "warning":
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
}
