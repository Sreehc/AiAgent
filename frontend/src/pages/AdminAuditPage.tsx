import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Pagination,
  Panel,
  Select,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableExpandedRow,
  TableHead,
  TableHeader,
  TableLoading,
  TableRow,
  Tabs
} from "../components/ui";
import { JsonBlock } from "../features/workspace/JsonBlock";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { AdminAuditRow, ApiError } from "../services/api";

type AuditTab = "users" | "runs" | "tools" | "logins";
type AuditColumnKind = "text" | "status" | "date" | "duration" | "number" | "wide";

type AuditColumn = {
  label: string;
  keys: string[];
  kind?: AuditColumnKind;
};

const auditColumnPresets: Record<AuditTab, AuditColumn[]> = {
  users: [
    { label: "时间", keys: ["createdAt"], kind: "date" },
    { label: "用户", keys: ["username"] },
    { label: "动作", keys: ["action"], kind: "wide" },
    { label: "目标对象", keys: ["target"], kind: "wide" },
    { label: "角色/权限变化", keys: ["roleChange"], kind: "wide" },
    { label: "结果", keys: ["result"], kind: "status" },
    { label: "IP", keys: ["ip"] }
  ],
  runs: [
    { label: "时间", keys: ["createdAt"], kind: "date" },
    { label: "用户", keys: ["username"] },
    { label: "会话/Run", keys: ["runId", "sessionId"], kind: "wide" },
    { label: "任务标题", keys: ["taskTitle"], kind: "wide" },
    { label: "执行模式", keys: ["executionMode"] },
    { label: "状态", keys: ["status"], kind: "status" },
    { label: "耗时", keys: ["durationMs"], kind: "duration" },
    { label: "错误摘要", keys: ["errorSummary"], kind: "wide" },
    { label: "工具调用数", keys: ["toolCallCount"], kind: "number" },
    { label: "产物数", keys: ["artifactCount"], kind: "number" }
  ],
  tools: [
    { label: "时间", keys: ["createdAt"], kind: "date" },
    { label: "服务", keys: ["serverCode"] },
    { label: "工具名", keys: ["toolName"], kind: "wide" },
    { label: "关联 Run", keys: ["runId", "toolCallId"], kind: "wide" },
    { label: "状态", keys: ["status"], kind: "status" },
    { label: "耗时", keys: ["durationMs"], kind: "duration" },
    { label: "错误类型", keys: ["errorType", "errorCode"] },
    { label: "输入摘要", keys: ["inputSummary"], kind: "wide" },
    { label: "输出摘要", keys: ["outputSummary"], kind: "wide" }
  ],
  logins: [
    { label: "时间", keys: ["createdAt"], kind: "date" },
    { label: "用户", keys: ["username"] },
    { label: "IP", keys: ["ip"] },
    { label: "User Agent", keys: ["userAgent"], kind: "wide" },
    { label: "结果", keys: ["result"], kind: "status" },
    { label: "失败原因", keys: ["failureReason"], kind: "wide" }
  ]
};

export function AdminAuditPage() {
  const { session } = useAuthSession();
  const [tab, setTab] = useState<AuditTab>("runs");
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) void loadRows(tab);
  }, [session?.accessToken, tab, pageNo]);

  async function loadRows(nextTab = tab) {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const query = { keyword: keyword.trim() || undefined, status: status || undefined, result: status || undefined, pageNo, pageSize: 50 };
      const result = nextTab === "users"
        ? await adminApi.listAuditUsers(session.accessToken, query)
        : nextTab === "runs"
          ? await adminApi.listAuditRuns(session.accessToken, query)
          : nextTab === "tools"
            ? await adminApi.listAuditTools(session.accessToken, query)
            : await adminApi.listAuditLogins(session.accessToken, query);
      setRows(result);
      setExpandedRowKey(null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user.roles.includes("ADMIN")) return <section className="page"><header className="page-header"><h1>审计</h1><Badge tone="neutral">Admin only</Badge></header><EmptyState message="当前账号没有管理员权限。" /></section>;

  return (
    <section className="page">
      <header className="page-header"><div><h1>审计</h1><p>查看用户、任务、工具调用和登录记录。</p></div><Badge>{rows.length} 条</Badge></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Panel title="审计记录" eyebrow="Audit" action={<Button type="button" variant="secondary" size="sm" loading={loading} onClick={() => void loadRows()}>刷新</Button>}>
        <div className="stack">
          <Tabs ariaLabel="审计类型" value={tab} items={[{ id: "users", label: "用户" }, { id: "runs", label: "任务" }, { id: "tools", label: "工具" }, { id: "logins", label: "登录" }]} onChange={(nextTab) => { setTab(nextTab); setPageNo(1); }} />
          <div className="form-grid form-grid--compact">
            <Field label="关键词"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="用户 / Run / Tool / IP" /></Field>
            <Field label={tab === "logins" ? "登录结果" : "状态"}><Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">全部</option>
              {tab === "runs" ? <>
                <option value="FAILED">FAILED</option>
                <option value="TIMED_OUT">TIMED_OUT</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </> : null}
              {tab === "tools" ? <>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </> : null}
              {tab === "logins" ? <>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </> : null}
            </Select></Field>
            <div className="button-row button-row--end"><Button type="button" variant="secondary" onClick={() => { setPageNo(1); void loadRows(); }}>筛选</Button></div>
          </div>
          {renderAuditTable({ rows, tab, loading, expandedRowKey, setExpandedRowKey })}
          <Pagination pageNo={pageNo} hasMore={rows.length >= 50} loading={loading} onChange={(page) => setPageNo(page)} />
        </div>
      </Panel>
    </section>
  );
}

function getAuditStatus(row: AdminAuditRow) {
  return formatAuditValue(readFirst(row, ["status", "result", "loginResult", "success"])) || "UNKNOWN";
}

function readFirst(row: AdminAuditRow, keys: string[]) {
  return keys.map((key) => row[key]).find((value) => value !== undefined && value !== null && value !== "");
}

function renderAuditTable({
  rows,
  tab,
  loading,
  expandedRowKey,
  setExpandedRowKey
}: {
  rows: AdminAuditRow[];
  tab: AuditTab;
  loading: boolean;
  expandedRowKey: string | null;
  setExpandedRowKey: (key: string | null) => void;
}) {
  const columns = auditColumnPresets[tab];

  return (
    <Table className="audit-table" density="compact" minWidth="1120px">
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.label} numeric={column.kind === "number"} status={column.kind === "status"}>
              {column.label}
            </TableHead>
          ))}
          <TableHead align="right">详情</TableHead>
        </TableRow>
      </TableHeader>
      {loading ? <TableLoading columns={columns.length + 1} rows={5} /> : null}
      {!loading && rows.length === 0 ? <TableEmpty colSpan={columns.length + 1}><EmptyState message="暂无审计记录。" /></TableEmpty> : null}
      {!loading && rows.length > 0 ? (
        <TableBody>
          {rows.map((row, index) => {
            const rowKey = getAuditRowKey(row, tab, index);
            return (
              <>
                <TableRow key={rowKey} expanded={expandedRowKey === rowKey}>
                  {columns.map((column) => (
                    <TableCell key={column.label} className={`audit-table-cell ${column.kind === "wide" ? "audit-table-cell--wide" : ""}`} numeric={column.kind === "number"} status={column.kind === "status"}>
                      {renderAuditCell(row, column)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setExpandedRowKey(expandedRowKey === rowKey ? null : rowKey)}>
                      {expandedRowKey === rowKey ? "收起" : "展开"}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRowKey === rowKey ? (
                  <TableExpandedRow colSpan={columns.length + 1}>
                    {renderAuditDetails(row, columns)}
                  </TableExpandedRow>
                ) : null}
              </>
            );
          })}
        </TableBody>
      ) : null}
    </Table>
  );
}

function renderAuditCell(row: AdminAuditRow, column: AuditColumn) {
  const value = readFirst(row, column.keys);
  if (column.kind === "status") {
    return <StatusPill status={getAuditStatus(row)} />;
  }
  if (column.kind === "date") {
    return <span title={formatAuditValue(value)}>{formatAuditDate(value)}</span>;
  }
  if (column.kind === "duration") {
    return <span className="numeric">{formatAuditDuration(value)}</span>;
  }
  if (column.kind === "number") {
    return <span className="numeric">{formatAuditValue(value)}</span>;
  }
  return <span title={formatAuditValue(value)}>{formatAuditValue(value)}</span>;
}

function renderAuditDetails(row: AdminAuditRow, columns: AuditColumn[]) {
  return (
    <div className="stack">
      <div className="audit-detail-grid">
        {columns.map((column) => (
          <div key={column.label} className="audit-detail-grid__item">
            <span>{column.label}</span>
            <strong>{formatAuditValue(readFirst(row, column.keys))}</strong>
          </div>
        ))}
      </div>
      <JsonBlock payload={row} label="原始审计 payload" summary={`${Object.keys(row).length} 个原始字段`} />
    </div>
  );
}

function getAuditRowKey(row: AdminAuditRow, tab: AuditTab, index: number) {
  return `${tab}-${formatAuditValue(readFirst(row, ["id", "auditId", "runId", "toolCallId", "sessionId", "createdAt", "timestamp"]))}-${index}`;
}

function formatAuditDate(value: unknown) {
  const text = formatAuditValue(value);
  if (text === "-") return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function formatAuditDuration(value: unknown) {
  if (typeof value === "number") {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
    return `${value}ms`;
  }
  const numeric = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isNaN(numeric)) return formatAuditDuration(numeric);
  return formatAuditValue(value);
}

function formatAuditValue(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatAuditValue).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
