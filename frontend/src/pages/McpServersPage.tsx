import { FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Button, EmptyState, Field, Input, Panel, Select, StatusPill } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest, ApiError, McpDiscoverResponse, McpHealthResponse, McpServerItem } from "../services/api";

type TransportType = "SSE" | "STDIO" | "STREAMABLE_HTTP";

const DEFAULT_FORM = {
  name: "web-search",
  serverCode: "web_search",
  transportType: "SSE" as TransportType,
  endpoint: "http://localhost:9001",
  commandLine: "",
  active: true
};

export function McpServersPage() {
  const { session } = useAuthSession();
  const [servers, setServers] = useState<McpServerItem[]>([]);
  const [selectedServerCode, setSelectedServerCode] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [discoveries, setDiscoveries] = useState<Record<string, McpDiscoverResponse>>({});
  const [healthChecks, setHealthChecks] = useState<Record<string, McpHealthResponse>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverToDelete, setServerToDelete] = useState<McpServerItem | null>(null);

  const selectedServer = servers.find((item) => item.serverCode === selectedServerCode) ?? null;

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadServers();
  }, [session?.accessToken]);

  async function loadServers() {
    if (!session?.accessToken) {
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<McpServerItem[]>("/admin/mcp-servers", {}, session.accessToken);
      setServers(result);
      if (result.length > 0 && !selectedServerCode) {
        selectServer(result[0]);
      }
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  function selectServer(server: McpServerItem) {
    setSelectedServerCode(server.serverCode);
    setForm({ name: server.name, serverCode: server.serverCode, transportType: server.transportType, endpoint: server.endpoint, commandLine: server.commandLine ?? "", active: server.status === "ACTIVE" });
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiRequest<McpServerItem>("/admin/mcp-servers", { method: "POST", body: JSON.stringify({ name: form.name, serverCode: form.serverCode, transportType: form.transportType, endpoint: form.endpoint, commandLine: form.commandLine || null }) }, session.accessToken);
      await loadServers();
      selectServer(created);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate() {
    if (!session?.accessToken || !selectedServerCode) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiRequest<McpServerItem>(`/admin/mcp-servers/${selectedServerCode}`, { method: "PUT", body: JSON.stringify({ name: form.name, transportType: form.transportType, endpoint: form.endpoint, commandLine: form.commandLine || null, active: form.active }) }, session.accessToken);
      await loadServers();
      selectServer(updated);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirmDelete() {
    if (!session?.accessToken || !serverToDelete) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<void>(`/admin/mcp-servers/${serverToDelete.serverCode}`, { method: "DELETE" }, session.accessToken);
      setSelectedServerCode(null);
      setDiscoveries({});
      setHealthChecks({});
      setForm(DEFAULT_FORM);
      setServerToDelete(null);
      await loadServers();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDiscover(serverCode: string) {
    if (!session?.accessToken) {
      return;
    }
    setError(null);
    try {
      const result = await apiRequest<McpDiscoverResponse>(`/admin/mcp-servers/${serverCode}/discover`, { method: "POST" }, session.accessToken);
      setDiscoveries((current) => ({ ...current, [serverCode]: result }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onHealth(serverCode: string) {
    if (!session?.accessToken) {
      return;
    }
    setError(null);
    try {
      const result = await apiRequest<McpHealthResponse>(`/admin/mcp-servers/${serverCode}/health`, {}, session.accessToken);
      setHealthChecks((current) => ({ ...current, [serverCode]: result }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  if (!session?.user.roles.includes("ADMIN")) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>MCP 服务器</h1>
          <span className="badge badge--neutral">Admin only</span>
        </header>
        <EmptyState message="当前账号没有管理员权限，无法访问 MCP 配置。" />
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>MCP 服务器</h1>
        <div className="page-header__meta">
          <span className="badge badge--neutral">{servers.filter((server) => server.status === "ACTIVE").length} 个活跃</span>
          <span className="badge badge--neutral">{selectedServer?.transportType ?? "未选择"}</span>
        </div>
        <span className="badge">{servers.length} 个服务</span>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-grid content-grid--wide-side">
        <aside className="stack">
          <Panel title="新增 MCP 服务" eyebrow="Create">
            <form className="form-grid" onSubmit={onCreate}>
              <Field label="名称"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
              <Field label="服务代码"><Input value={form.serverCode} onChange={(event) => setForm((current) => ({ ...current, serverCode: event.target.value }))} disabled={selectedServer !== null} /></Field>
              <Field label="传输协议"><Select value={form.transportType} onChange={(event) => setForm((current) => ({ ...current, transportType: event.target.value as TransportType }))}><option value="SSE">SSE</option><option value="STDIO">STDIO</option><option value="STREAMABLE_HTTP">STREAMABLE_HTTP</option></Select></Field>
              <Field label="服务端点"><Input value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} /></Field>
              <Field label="启动命令"><Input value={form.commandLine} onChange={(event) => setForm((current) => ({ ...current, commandLine: event.target.value }))} placeholder="仅 STDIO 可选" /></Field>
              <Button type="submit" variant="primary" loading={submitting} fullWidth>创建服务</Button>
            </form>
          </Panel>
          <Panel title="服务列表" eyebrow="Registry" action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadServers()}>刷新</Button>}>
            <div className="list">
              {servers.map((server) => (
                <button key={server.serverCode} type="button" className={`list-item ${selectedServerCode === server.serverCode ? "list-item--active" : ""}`} onClick={() => selectServer(server)}>
                  <strong>{server.name}</strong>
                  <span>{server.serverCode}</span>
                  <small>{server.transportType}</small>
                  <StatusPill status={server.status} />
                </button>
              ))}
              {!loading && servers.length === 0 ? <EmptyState message="还没有 MCP 服务配置，先注册一个。" /> : null}
            </div>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title={selectedServer?.name ?? "选择一个服务"} eyebrow="Configuration" action={<StatusPill status={selectedServer?.status ?? "IDLE"} />}>
            {selectedServer ? (
              <div className="form-grid">
                <Field label="名称"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                <Field label="传输协议"><Select value={form.transportType} onChange={(event) => setForm((current) => ({ ...current, transportType: event.target.value as TransportType }))}><option value="SSE">SSE</option><option value="STDIO">STDIO</option><option value="STREAMABLE_HTTP">STREAMABLE_HTTP</option></Select></Field>
                <Field label="服务端点"><Input value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} /></Field>
                <Field label="启动命令"><Input value={form.commandLine} onChange={(event) => setForm((current) => ({ ...current, commandLine: event.target.value }))} /></Field>
                <label className="kb-option"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} /><span>启用该服务</span><small>{form.active ? "ACTIVE" : "INACTIVE"}</small></label>
                <div className="cluster"><Button type="button" variant="primary" loading={submitting} onClick={() => void onUpdate()}>保存配置</Button><Button type="button" variant="danger" disabled={submitting} onClick={() => setServerToDelete(selectedServer)}>删除配置</Button></div>
              </div>
            ) : <EmptyState message="选择左侧服务后可编辑配置、做发现与健康检查。" />}
          </Panel>

          <div className="content-grid content-grid--two">
            <Panel title="工具发现" eyebrow="Discover" action={selectedServer ? <Button type="button" variant="ghost" size="sm" onClick={() => void onDiscover(selectedServer.serverCode)}>发现工具</Button> : null}>
              <div className="timeline">
                {(selectedServer ? discoveries[selectedServer.serverCode]?.tools ?? [] : []).map((tool) => (
                  <article key={tool.toolName} className="timeline-item"><div className="timeline-item__header"><strong>{tool.toolName}</strong><small>{tool.toolType}</small></div><p>{tool.description}</p></article>
                ))}
                {selectedServer && !discoveries[selectedServer.serverCode] ? <EmptyState message="点击“发现工具”后，这里会展示工具清单和缓存结果。" /> : null}
              </div>
            </Panel>
            <Panel title="健康检查" eyebrow="Health" action={selectedServer ? <Button type="button" variant="ghost" size="sm" onClick={() => void onHealth(selectedServer.serverCode)}>检查健康</Button> : null}>
              {selectedServer && healthChecks[selectedServer.serverCode] ? (
                <div className="list-item"><div className="split"><strong>{healthChecks[selectedServer.serverCode].serverCode}</strong><StatusPill status={healthChecks[selectedServer.serverCode].status} /></div><p>{healthChecks[selectedServer.serverCode].message}</p></div>
              ) : <EmptyState message="点击“检查健康”后，可看到当前服务的连通状态。" />}
            </Panel>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={serverToDelete !== null}
        title="确认删除服务配置"
        message={<>确定要删除 MCP 服务「<strong>{serverToDelete?.name}</strong>」的配置吗？此操作不可恢复。</>}
        confirmText="删除配置"
        cancelText="取消"
        onConfirm={onConfirmDelete}
        onCancel={() => setServerToDelete(null)}
        danger
      />
    </section>
  );
}
