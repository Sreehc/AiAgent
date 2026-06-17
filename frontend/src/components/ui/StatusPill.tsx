import { Badge } from "./Badge";

type StatusPillProps = {
  status?: string | null;
  label?: string;
};

type Tone = "success" | "info" | "danger" | "warning" | "neutral";

export function StatusPill({ status, label }: StatusPillProps) {
  const normalized = (status ?? "UNKNOWN").toUpperCase();
  const tone = getTone(normalized);
  return (
    <Badge tone={tone} className="gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass(tone)}`} aria-hidden="true" />
      {label ?? formatStatus(normalized)}
    </Badge>
  );
}

function dotClass(tone: Tone) {
  switch (tone) {
    case "success":
      return "bg-success";
    case "info":
      return "bg-info";
    case "danger":
      return "bg-destructive";
    case "warning":
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
}

function getTone(status: string): Tone {
  if (["COMPLETED", "SUCCESS", "ACTIVE", "HEALTHY"].includes(status)) {
    return "success";
  }
  if (["RUNNING", "PENDING", "PROCESSING", "IDLE"].includes(status)) {
    return "info";
  }
  if (["FAILED", "ERROR", "INACTIVE", "UNHEALTHY", "EXPIRED", "TIMED_OUT"].includes(status)) {
    return "danger";
  }
  if (["WARNING", "USED", "PAUSED", "CANCEL_REQUESTED", "CANCELLED", "SKIPPED"].includes(status)) {
    return "warning";
  }
  return "neutral";
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    IDLE: "空闲",
    RUNNING: "执行中",
    COMPLETED: "已完成",
    FAILED: "失败",
    PAUSED: "已暂停",
    CANCEL_REQUESTED: "取消中",
    CANCELLED: "已取消",
    TIMED_OUT: "已超时",
    SKIPPED: "已跳过",
    PENDING: "等待中",
    PROCESSING: "处理中",
    ACTIVE: "活跃",
    INACTIVE: "未激活",
    HEALTHY: "健康",
    UNHEALTHY: "异常",
    SUCCESS: "成功",
    ERROR: "错误",
    USED: "已使用",
    EXPIRED: "已过期"
  };
  return labels[status] ?? status;
}
