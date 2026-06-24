import { FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Badge, EmptyState } from "../components/ui";
import { showToast } from "../components/Toast";
import { McpFormState, McpServerForm } from "../features/system/McpServerForm";
import { McpServerRegistry } from "../features/system/McpServerRegistry";
import { McpToolList, McpToolTestResult } from "../features/system/McpToolList";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { ApiError, McpDiscoverResponse, McpHealthResponse, McpServerItem } from "../services/api";

const DEFAULT_FORM: McpFormState = { name: "web-search", serverCode: "web_search", transportType: "SSE", endpoint: "http://localhost:9001", commandLine: null, active: true };

export function McpServersPage() {
  const { session } = useAuthSession();
  const [servers, setServers] = useState<McpServerItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [discoveries, setDiscoveries] = useState<Record<string, McpDiscoverResponse>>({});
  const [healthChecks, setHealthChecks] = useState<Record<string, McpHealthResponse>>({});
  const [toolTestResults, setToolTestResults] = useState<Record<string, McpToolTestResult>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverToDelete, setServerToDelete] = useState<McpServerItem | null>(null);
  const selected = servers.find((item) => item.serverCode === selectedCode) ?? null;

  useEffect(() => {
    if (session?.accessToken) void loadServers();
  }, [session?.accessToken]);

  async function loadServers() {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const result = await adminApi.listMcpServers(session.accessToken);
      setServers(result);
      if (!selectedCode && result[0]) selectServer(result[0]);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  function selectServer(server: McpServerItem) {
    setSelectedCode(server.serverCode);
    setToolTestResults({});
    setForm({ name: server.name, serverCode: server.serverCode, transportType: server.transportType, endpoint: server.endpoint ?? "", commandLine: server.commandLine, active: server.status === "ACTIVE" });
  }

  function resetSelection() {
    setSelectedCode(null);
    setToolTestResults({});
    setForm(DEFAULT_FORM);
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await adminApi.createMcpServer(session.accessToken, {
        name: form.name,
        serverCode: form.serverCode,
        transportType: form.transportType,
        endpoint: form.endpoint.trim() || null,
        commandLine: form.commandLine?.trim() || null
      });
      await loadServers();
      selectServer(created);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate() {
    if (!session?.accessToken || !selectedCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await adminApi.updateMcpServer(session.accessToken, selectedCode, {
        name: form.name,
        transportType: form.transportType,
        endpoint: form.endpoint.trim() || null,
        commandLine: form.commandLine?.trim() || null,
        active: form.active
      });
      await loadServers();
      selectServer(updated);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!session?.accessToken || !serverToDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.deleteMcpServer(session.accessToken, serverToDelete.serverCode);
      setDiscoveries({});
      setHealthChecks({});
      setServerToDelete(null);
      resetSelection();
      await loadServers();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDiscover() {
    if (!session?.accessToken || !selectedCode) return;
    try {
      const result = await adminApi.discoverMcpTools(session.accessToken, selectedCode);
      setDiscoveries((current) => ({ ...current, [selectedCode]: result }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onHealth() {
    if (!session?.accessToken || !selectedCode) return;
    try {
      const result = await adminApi.checkMcpHealth(session.accessToken, selectedCode);
      setHealthChecks((current) => ({ ...current, [selectedCode]: result }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onTestTool(toolName: string) {
    if (!session?.accessToken || !selectedCode) return;
    try {
      const result = await adminApi.testMcpTool(session.accessToken, selectedCode, toolName, "AiAgent admin smoke test");
      setToolTestResults((current) => ({ ...current, [result.toolName]: result }));
      showToast("success", `${result.toolName}: ${result.resultText}`);
    } catch (requestError) {
      const apiError = requestError as ApiError;
      setToolTestResults((current) => ({
        ...current,
        [toolName]: { serverCode: selectedCode, toolName, resultText: apiError.message, responsePayload: "" }
      }));
      showToast("error", `${toolName}: ${apiError.message}`);
    }
  }

  if (!session?.user.roles.includes("ADMIN")) return <section className="page"><header className="page-header"><h1>MCP 服务器</h1><Badge tone="neutral">Admin only</Badge></header><EmptyState message="当前账号没有管理员权限，无法访问 MCP 配置。" /></section>;

  const mcpSummary = buildMcpSummary(servers, healthChecks);

  return (
    <section className="page">
      <header className="page-header"><div><h1>MCP 服务器</h1><p>注册外部工具服务，检查健康状态并审计发现到的工具清单。</p></div><div className="page-header__meta"><Badge tone={mcpSummary.unhealthyServers.length > 0 ? "warning" : "success"}>{mcpSummary.unhealthyServers.length} 个异常</Badge><Badge tone="neutral">{mcpSummary.activeServers} 个活跃</Badge><Badge tone="neutral">{selected?.transportType ?? "未选择"}</Badge></div><Badge>{servers.length} 个服务</Badge></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {mcpSummary.unhealthyServers.length > 0 ? <Alert tone="warning" title="MCP 健康风险">{mcpSummary.unhealthyServers.length} 个服务处于未激活或健康检查异常状态。请优先检查 endpoint、transport 和工具发现结果。</Alert> : null}
      <div className="mcp-summary-grid">
        <SummaryCard label="活跃服务" value={`${mcpSummary.activeServers}/${servers.length}`} detail="ACTIVE / total" tone={mcpSummary.inactiveServers.length > 0 ? "warning" : "success"} />
        <SummaryCard label="Transport" value={mcpSummary.transportLabel} detail="当前服务传输协议" tone="neutral" />
        <SummaryCard label="已发现工具" value={String(mcpSummary.discoveredTools)} detail="来自当前缓存的 discovery" tone={mcpSummary.discoveredTools > 0 ? "success" : "neutral"} />
        <SummaryCard label="健康检查" value={String(Object.keys(healthChecks).length)} detail={`${mcpSummary.unhealthyServers.length} 个需关注`} tone={mcpSummary.unhealthyServers.length > 0 ? "danger" : "success"} />
      </div>
      <div className="content-grid content-grid--wide-side">
        <aside className="stack">{selected ? <button type="button" className="text-action" onClick={resetSelection}>+ 注册新服务</button> : null}<McpServerForm form={form} editing={selected !== null} submitting={submitting} onChange={setForm} onCreate={onCreate} onUpdate={() => void onUpdate()} onDelete={() => selected && setServerToDelete(selected)} /><McpServerRegistry servers={servers} selectedCode={selectedCode} healthChecks={healthChecks} loading={loading} onSelect={selectServer} onRefresh={() => void loadServers()} /></aside>
        <main className="stack"><McpToolList server={selected} discovery={selectedCode ? discoveries[selectedCode] : undefined} health={selectedCode ? healthChecks[selectedCode] : undefined} testResults={toolTestResults} onDiscover={() => void onDiscover()} onHealth={() => void onHealth()} onTestTool={(toolName) => void onTestTool(toolName)} /></main>
      </div>
      <ConfirmDialog isOpen={serverToDelete !== null} title="确认删除服务配置" message={<>确定要删除 MCP 服务「<strong>{serverToDelete?.name}</strong>」吗？此操作不可恢复。</>} confirmText="删除配置" cancelText="取消" onConfirm={onDelete} onCancel={() => setServerToDelete(null)} danger />
    </section>
  );
}

function SummaryCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <div className="mcp-summary-card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function buildMcpSummary(servers: McpServerItem[], healthChecks: Record<string, McpHealthResponse>) {
  const activeServers = servers.filter((server) => server.status === "ACTIVE").length;
  const inactiveServers = servers.filter((server) => server.status !== "ACTIVE");
  const unhealthyServers = servers.filter((server) => {
    const health = healthChecks[server.serverCode];
    return server.status !== "ACTIVE" || (health && health.healthState === "unhealthy");
  });
  const selectedTransportCounts = servers.reduce<Record<string, number>>((counts, server) => {
    counts[server.transportType] = (counts[server.transportType] ?? 0) + 1;
    return counts;
  }, {});
  const transportLabel = Object.entries(selectedTransportCounts)
    .map(([transport, count]) => `${transport} ${count}`)
    .join(" · ") || "未配置";
  const discoveredTools = Object.values(healthChecks).reduce((total, health) => total + Math.max(0, health.toolCount ?? 0), 0);

  return { activeServers, inactiveServers, unhealthyServers, transportLabel, discoveredTools };
}
