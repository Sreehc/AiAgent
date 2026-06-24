import { McpDiscoverResponse, McpHealthResponse, McpServerItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, StatusPill } from "../../components/ui";

export type McpToolTestResult = {
  serverCode: string;
  toolName: string;
  resultText: string;
  responsePayload: string;
};

type McpToolListProps = {
  server: McpServerItem | null;
  discovery?: McpDiscoverResponse;
  health?: McpHealthResponse;
  testResults: Record<string, McpToolTestResult>;
  onDiscover: () => void;
  onHealth: () => void;
  onTestTool: (toolName: string) => void;
};

export function McpToolList({ server, discovery, health, testResults, onDiscover, onHealth, onTestTool }: McpToolListProps) {
  return (
    <div className="content-grid content-grid--two">
      <Panel title="工具发现" eyebrow="Discover" action={server ? <Button type="button" variant="ghost" size="sm" onClick={onDiscover}>发现工具</Button> : null}>
        {discovery ? <div className="stack"><div className="split"><span className="muted">{discovery.cached ? "来自缓存" : "实时发现"}</span><Badge>{discovery.tools.length} tools</Badge></div><div className="mcp-tool-grid">{discovery.tools.map((tool) => <article key={tool.toolName} className="mcp-tool-card"><div className="mcp-tool-card__header"><strong>{tool.toolName}</strong><Badge tone="neutral">{tool.toolType}</Badge></div><p>{tool.description}</p>{testResults[tool.toolName] ? <div className="mcp-tool-test-result"><strong>测试结果</strong><span>{testResults[tool.toolName].resultText}</span>{testResults[tool.toolName].responsePayload ? <code>{testResults[tool.toolName].responsePayload}</code> : null}</div> : null}<Button type="button" variant="secondary" size="sm" onClick={() => onTestTool(tool.toolName)}>测试工具</Button></article>)}</div></div> : <EmptyState message={server ? "点击“发现工具”读取工具清单。" : "先选择一个 MCP 服务。"} />}
      </Panel>
      <Panel title="健康检查" eyebrow="Health" action={server ? <Button type="button" variant="ghost" size="sm" onClick={onHealth}>检查健康</Button> : null}>
        {health ? <div className="mcp-health-card"><div className="mcp-health-card__header"><strong>{health.serverCode}</strong><StatusPill status={health.status} /></div><p>{health.message}</p><div className="mcp-health-card__metrics"><span><small>Latency</small><strong>{health.latencyMs !== null ? `${health.latencyMs} ms` : "N/A"}</strong></span><span><small>Tools</small><strong>{health.toolCount}</strong></span><span><small>Transport</small><strong>{health.transportType}</strong></span></div>{health.errorCode ? <Badge tone="danger">{health.errorCode}</Badge> : null}<small>Checked at {health.checkedAt}</small></div> : <EmptyState message={server ? "点击“检查健康”验证当前服务连通状态。" : "先选择一个 MCP 服务。"} />}
      </Panel>
    </div>
  );
}
