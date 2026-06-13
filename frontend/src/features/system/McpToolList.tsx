import { McpDiscoverResponse, McpHealthResponse, McpServerItem } from "../../services/api";
import { Button, EmptyState, Panel, StatusPill } from "../../components/ui";

type McpToolListProps = {
  server: McpServerItem | null;
  discovery?: McpDiscoverResponse;
  health?: McpHealthResponse;
  onDiscover: () => void;
  onHealth: () => void;
  onTestTool: (toolName: string) => void;
};

export function McpToolList({ server, discovery, health, onDiscover, onHealth, onTestTool }: McpToolListProps) {
  return (
    <div className="content-grid content-grid--two">
      <Panel title="工具发现" eyebrow="Discover" action={server ? <Button type="button" variant="ghost" size="sm" onClick={onDiscover}>发现工具</Button> : null}>
        {discovery ? <div className="stack"><div className="split"><span className="muted">{discovery.cached ? "来自缓存" : "实时发现"}</span><span className="badge">{discovery.tools.length} tools</span></div><div className="timeline">{discovery.tools.map((tool) => <article key={tool.toolName} className="timeline-item"><div className="timeline-item__header"><strong>{tool.toolName}</strong><span className="badge badge--neutral">{tool.toolType}</span></div><p>{tool.description}</p><Button type="button" variant="secondary" size="sm" onClick={() => onTestTool(tool.toolName)}>测试工具</Button></article>)}</div></div> : <EmptyState message={server ? "点击“发现工具”读取工具清单。" : "先选择一个 MCP 服务。"} />}
      </Panel>
      <Panel title="健康检查" eyebrow="Health" action={server ? <Button type="button" variant="ghost" size="sm" onClick={onHealth}>检查健康</Button> : null}>
        {health ? <div className="list-item"><div className="split"><strong>{health.serverCode}</strong><StatusPill status={health.status} /></div><p>{health.message}</p></div> : <EmptyState message={server ? "点击“检查健康”验证当前服务连通状态。" : "先选择一个 MCP 服务。"} />}
      </Panel>
    </div>
  );
}
