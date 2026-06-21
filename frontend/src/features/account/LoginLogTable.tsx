import { LoginLogEntry } from "../../services/accountApi";
import { EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "../../components/ui";

export function LoginLogTable({ logs }: { logs: LoginLogEntry[] }) {
  return (
    <Panel title="最近登录日志" eyebrow="Audit" description="仅展示当前登录用户最近的访问记录。">
      <Table className="account-login-log-table" density="compact" minWidth="760px">
        <TableHeader>
          <TableRow>
            <TableHead>时间</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>User Agent</TableHead>
            <TableHead status>结果</TableHead>
          </TableRow>
        </TableHeader>
        {logs.length > 0 ? (
          <TableBody>
            {logs.map((log) => (
              <TableRow key={`${log.loginAt}-${log.loginIp}`}>
                <TableCell className="account-login-log-table__time"><span title={log.loginAt}>{formatLoginDate(log.loginAt)}</span></TableCell>
                <TableCell className="account-login-log-table__ip"><span title={log.loginIp}>{log.loginIp}</span></TableCell>
                <TableCell className="account-login-log-table__agent"><span title={log.userAgent}>{log.userAgent}</span></TableCell>
                <TableCell status>
                  <StatusPill status={log.loginResult} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <TableEmpty colSpan={4}><EmptyState message="暂无登录记录。" /></TableEmpty>
        )}
      </Table>
    </Panel>
  );
}

function formatLoginDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}
