import { Button, EmptyState, Panel, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui";
import { InviteItem } from "../../services/api";

type InviteCodePanelProps = {
  invites: InviteItem[];
  loading: boolean;
  copiedToken: string | null;
  onCopy: (token: string) => void;
};

export function InviteCodePanel({ invites, loading, copiedToken, onCopy }: InviteCodePanelProps) {
  return (
    <Panel title="最近邀请码" eyebrow="Invites" action={<span className="text-xs text-muted-foreground">{invites.length} 条</span>}>
      {invites.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邀请码</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={`${invite.inviteToken}-${invite.createdAt}`}>
                <TableCell>
                  <strong className="font-mono text-sm">{invite.inviteToken}</strong>
                  <div className="text-xs text-muted-foreground">过期：{formatDateTime(invite.expiresAt)}</div>
                </TableCell>
                <TableCell>
                  <StatusPill status={invite.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onCopy(invite.inviteToken)}>
                    {copiedToken === invite.inviteToken ? "已复制" : "复制"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      {!loading && invites.length === 0 ? <EmptyState message="还没有新生成的邀请码。" /> : null}
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
