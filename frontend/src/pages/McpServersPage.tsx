import { FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, EmptyState } from "../components/ui";
import { McpFormState, McpServerForm } from "../features/system/McpServerForm";
import { McpServerRegistry } from "../features/system/McpServerRegistry";
import { McpToolList } from "../features/system/McpToolList";
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
    setForm({ name: server.name, serverCode: server.serverCode, transportType: server.transportType, endpoint: server.endpoint ?? "", commandLine: server.commandLine, active: server.status === "ACTIVE" });
  }

  function resetSelection() {
    setSelectedCode(null);
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

  if (!session?.user.roles.includes("ADMIN")) return <section className="page"><header className="page-header"><h1>MCP 服务器</h1><span className="badge badge--neutral">Admin only</span></header><EmptyState message="当前账号没有管理员权限，无法访问 MCP 配置。" /></section>;

  return (
    <section className="page">
      <header className="page-header"><div><h1>MCP 服务器</h1><p>注册外部工具服务，检查健康状态并审计发现到的工具清单。</p></div><div className="page-header__meta"><span className="badge badge--neutral">{servers.filter((item) => item.status === "ACTIVE").length} 个活跃</span><span className="badge badge--neutral">{selected?.transportType ?? "未选择"}</span></div><span className="badge">{servers.length} 个服务</span></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="content-grid content-grid--wide-side">
        <aside className="stack">{selected ? <button type="button" className="text-action" onClick={resetSelection}>+ 注册新服务</button> : null}<McpServerForm form={form} editing={selected !== null} submitting={submitting} onChange={setForm} onCreate={onCreate} onUpdate={() => void onUpdate()} onDelete={() => selected && setServerToDelete(selected)} /><McpServerRegistry servers={servers} selectedCode={selectedCode} healthChecks={healthChecks} loading={loading} onSelect={selectServer} onRefresh={() => void loadServers()} /></aside>
        <main className="stack"><McpToolList server={selected} discovery={selectedCode ? discoveries[selectedCode] : undefined} health={selectedCode ? healthChecks[selectedCode] : undefined} onDiscover={() => void onDiscover()} onHealth={() => void onHealth()} /></main>
      </div>
      <ConfirmDialog isOpen={serverToDelete !== null} title="确认删除服务配置" message={<>确定要删除 MCP 服务「<strong>{serverToDelete?.name}</strong>」吗？此操作不可恢复。</>} confirmText="删除配置" cancelText="取消" onConfirm={onDelete} onCancel={() => setServerToDelete(null)} danger />
    </section>
  );
}
