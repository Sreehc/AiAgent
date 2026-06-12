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
      <div className="list">
        {loading ? <Skeleton lines={4} compact /> : null}
        {!loading && servers.map((server) => <button key={server.serverCode} type="button" className={`list-item ${selectedCode === server.serverCode ? "list-item--active" : ""}`} onClick={() => onSelect(server)}><div className="split"><strong>{server.name}</strong><StatusPill status={healthChecks[server.serverCode]?.status ?? server.status} /></div><span>{server.serverCode}</span><small>{server.transportType} · {server.endpoint || "local process"}</small></button>)}
        {!loading && servers.length === 0 ? <EmptyState title="没有 MCP 服务" message="注册一个 HTTP 或 STDIO 服务后即可发现工具。" /> : null}
      </div>
    </Panel>
  );
}
