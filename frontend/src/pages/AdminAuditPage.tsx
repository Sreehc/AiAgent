import { useEffect, useState } from "react";
import { Alert, Badge, Button, EmptyState, Field, Input, Panel, Select, Tabs } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { AdminAuditRow, ApiError } from "../services/api";

type AuditTab = "users" | "runs" | "tools" | "logins";

export function AdminAuditPage() {
  const { session } = useAuthSession();
  const [tab, setTab] = useState<AuditTab>("runs");
  const [rows, setRows] = useState<AdminAuditRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          <div className="table-list">
            {rows.map((row, index) => <article key={index} className="list-item"><pre>{JSON.stringify(row, null, 2)}</pre></article>)}
          </div>
          <div className="button-row button-row--between">
            <Button type="button" variant="secondary" disabled={pageNo <= 1 || loading} onClick={() => setPageNo((current) => Math.max(1, current - 1))}>上一页</Button>
            <Badge>第 {pageNo} 页</Badge>
            <Button type="button" variant="secondary" disabled={rows.length < 50 || loading} onClick={() => setPageNo((current) => current + 1)}>下一页</Button>
          </div>
          {!loading && rows.length === 0 ? <EmptyState message="暂无审计记录。" /> : null}
        </div>
      </Panel>
    </section>
  );
}
