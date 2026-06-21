import { McpHealthResponse, McpServerItem } from "../../services/api";
import { Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";

type McpServerRegistryProps = {
  servers: McpServerItem[];
  selectedCode: string | null;
  healthChecks: Record<string, McpHealthResponse>;
  loading: boolean;
  onSelect: (server: McpServerItem) => void;
  onRefresh: () => void;
};

export function McpServerRegistry({ servers, selectedCode, healthChecks, loading, onSelect, onRefresh }: McpServerRegistryProps) {
  return (
    <Panel title="服务注册表" eyebrow="Registry" action={<Button type="button" variant="ghost" size="sm" onClick={onRefresh}>刷新</Button>}>
      <div className="mcp-server-list">
        {loading ? <Skeleton lines={4} compact /> : null}
        {!loading && servers.map((server) => <button key={server.serverCode} type="button" className={`mcp-server-card ${selectedCode === server.serverCode ? "mcp-server-card--active" : ""}`} data-health={getHealthState(server, healthChecks[server.serverCode])} onClick={() => onSelect(server)}><div className="mcp-server-card__header"><strong>{server.name}</strong><StatusPill status={healthChecks[server.serverCode]?.status ?? server.status} /></div><code title={server.serverCode}>{server.serverCode}</code><div className="mcp-server-card__meta"><span>{server.transportType}</span><span>{server.endpoint || server.commandLine || "local process"}</span></div><div className="mcp-server-card__metrics"><small>{healthChecks[server.serverCode]?.latencyMs !== null && healthChecks[server.serverCode]?.latencyMs !== undefined ? `${healthChecks[server.serverCode]?.latencyMs} ms` : "未检查延迟"}</small><small>{healthChecks[server.serverCode]?.toolCount ?? 0} tools</small></div></button>)}
        {!loading && servers.length === 0 ? <EmptyState title="没有 MCP 服务" message="注册一个 HTTP 或 STDIO 服务后即可发现工具。" /> : null}
      </div>
    </Panel>
  );
}

function getHealthState(server: McpServerItem, health?: McpHealthResponse) {
  if (server.status !== "ACTIVE") return "unhealthy";
  if (!health) return "unknown";
  return health.healthState;
}
