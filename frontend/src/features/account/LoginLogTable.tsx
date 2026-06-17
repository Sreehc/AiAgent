import { LoginLogEntry } from "../../services/accountApi";
import { EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";

export function LoginLogTable({ logs }: { logs: LoginLogEntry[] }) {
  return (
    <Panel title="最近登录日志" eyebrow="Audit" description="仅展示当前登录用户最近的访问记录。">
      {logs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间 / 客户端</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>结果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={`${log.loginAt}-${log.loginIp}`}>
                <TableCell>
                  <strong>{new Date(log.loginAt).toLocaleString("zh-CN", { hour12: false })}</strong>
                  <div className="text-xs text-muted-foreground">{log.userAgent}</div>
                </TableCell>
                <TableCell className="font-mono text-sm">{log.loginIp}</TableCell>
                <TableCell>
                  <StatusPill status={log.loginResult} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState message="暂无登录记录。" />
      )}
    </Panel>
  );
}
