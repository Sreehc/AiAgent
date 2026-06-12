import { LoginLogEntry } from "../../services/accountApi";
import { EmptyState, Panel, StatusPill } from "../../components/ui";

export function LoginLogTable({ logs }: { logs: LoginLogEntry[] }) {
  return (
    <Panel title="最近登录日志" eyebrow="Audit" description="仅展示当前登录用户最近的访问记录。">
      <div className="table-list">{logs.map((log) => <article key={`${log.loginAt}-${log.loginIp}`} className="table-row"><div><strong>{new Date(log.loginAt).toLocaleString("zh-CN", { hour12: false })}</strong><br /><small>{log.userAgent}</small></div><span>{log.loginIp}</span><StatusPill status={log.loginResult} /></article>)}</div>
      {logs.length === 0 ? <EmptyState message="暂无登录记录。" /> : null}
    </Panel>
  );
}
