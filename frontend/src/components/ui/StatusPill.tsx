type StatusPillProps = {
  status?: string | null;
  label?: string;
};

export function StatusPill({ status, label }: StatusPillProps) {
  const normalized = (status ?? "UNKNOWN").toUpperCase();
  const tone = getTone(normalized);
  return <span className={`status-pill status-pill--${tone}`}>{label ?? formatStatus(normalized)}</span>;
}

function getTone(status: string) {
  if (["COMPLETED", "SUCCESS", "ACTIVE", "HEALTHY"].includes(status)) {
    return "success";
  }
  if (["RUNNING", "PENDING", "PROCESSING", "IDLE"].includes(status)) {
    return "info";
  }
  if (["FAILED", "ERROR", "INACTIVE", "UNHEALTHY", "EXPIRED"].includes(status)) {
    return "danger";
  }
  if (["WARNING", "USED"].includes(status)) {
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
