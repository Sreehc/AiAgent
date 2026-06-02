import { FormEvent, useEffect, useState } from "react";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  apiRequest,
  ApiError,
  McpDiscoverResponse,
  McpHealthResponse,
  McpServerItem
} from "../services/api";

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

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadServers();
  }, [session?.accessToken]);

  const selectedServer = servers.find((item) => item.serverCode === selectedServerCode) ?? null;

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
    setForm({
      name: server.name,
      serverCode: server.serverCode,
      transportType: server.transportType,
      endpoint: server.endpoint,
      commandLine: server.commandLine ?? "",
      active: server.status === "ACTIVE"
    });
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiRequest<McpServerItem>(
        "/admin/mcp-servers",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            serverCode: form.serverCode,
            transportType: form.transportType,
            endpoint: form.endpoint,
            commandLine: form.commandLine || null
          })
        },
        session.accessToken
      );
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
      const updated = await apiRequest<McpServerItem>(
        `/admin/mcp-servers/${selectedServerCode}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            transportType: form.transportType,
            endpoint: form.endpoint,
            commandLine: form.commandLine || null,
            active: form.active
          })
        },
        session.accessToken
      );
      await loadServers();
      selectServer(updated);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!session?.accessToken || !selectedServerCode) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<void>(
        `/admin/mcp-servers/${selectedServerCode}`,
        {
          method: "DELETE"
        },
        session.accessToken
      );
      setSelectedServerCode(null);
      setDiscoveries({});
      setHealthChecks({});
      setForm(DEFAULT_FORM);
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
      const result = await apiRequest<McpDiscoverResponse>(
        `/admin/mcp-servers/${serverCode}/discover`,
        {
          method: "POST"
        },
        session.accessToken
      );
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
      const result = await apiRequest<McpHealthResponse>(
        `/admin/mcp-servers/${serverCode}/health`,
        {},
        session.accessToken
      );
      setHealthChecks((current) => ({ ...current, [serverCode]: result }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  if (!session?.user.roles.includes("ADMIN")) {
    return (
      <section className="workspace">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Admin Only</p>
            <h2>MCP 配置页</h2>
          </div>
        </header>
        <div className="workspace__panel workspace-empty-block">
          <p>当前账号没有管理员权限，无法访问 MCP 配置。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h2>MCP 配置页</h2>
        </div>
        <span className="badge">{servers.length} servers</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>新增 MCP 服务</h3>
            <form className="workspace-form" onSubmit={onCreate}>
              <label>
                名称
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Server Code
                <input value={form.serverCode} onChange={(event) => setForm((current) => ({ ...current, serverCode: event.target.value }))} disabled={selectedServer !== null} />
              </label>
              <label>
                传输协议
                <select value={form.transportType} onChange={(event) => setForm((current) => ({ ...current, transportType: event.target.value as TransportType }))}>
                  <option value="SSE">SSE</option>
                  <option value="STDIO">STDIO</option>
                  <option value="STREAMABLE_HTTP">STREAMABLE_HTTP</option>
                </select>
              </label>
              <label>
                Endpoint
                <input value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} />
              </label>
              <label>
                Command Line
                <input value={form.commandLine} onChange={(event) => setForm((current) => ({ ...current, commandLine: event.target.value }))} placeholder="仅 STDIO 可选" />
              </label>
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "创建服务"}
              </button>
            </form>
          </div>

          <div className="workspace-sidebar__section">
            <div className="workspace-sidebar__heading">
              <h3>服务列表</h3>
              <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadServers()}>
                刷新
              </button>
            </div>
            {loading ? <p className="muted">正在加载服务...</p> : null}
            <div className="session-list">
              {servers.map((server) => (
                <button
                  key={server.serverCode}
                  type="button"
                  className={`session-card ${selectedServerCode === server.serverCode ? "session-card--active" : ""}`}
                  onClick={() => selectServer(server)}
                >
                  <strong>{server.name}</strong>
                  <span>{server.serverCode}</span>
                  <small>
                    {server.transportType} · {server.status}
                  </small>
                </button>
              ))}
              {!loading && servers.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有 MCP 服务配置，先注册一个。</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">Config</p>
                <h3>{selectedServer?.name ?? "选择一个服务"}</h3>
              </div>
              {selectedServer ? <span className="badge badge--soft">{selectedServer.status}</span> : null}
            </div>

            {selectedServer ? (
              <div className="workspace-form">
                <label>
                  名称
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  传输协议
                  <select value={form.transportType} onChange={(event) => setForm((current) => ({ ...current, transportType: event.target.value as TransportType }))}>
                    <option value="SSE">SSE</option>
                    <option value="STDIO">STDIO</option>
                    <option value="STREAMABLE_HTTP">STREAMABLE_HTTP</option>
                  </select>
                </label>
                <label>
                  Endpoint
                  <input value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} />
                </label>
                <label>
                  Command Line
                  <input value={form.commandLine} onChange={(event) => setForm((current) => ({ ...current, commandLine: event.target.value }))} />
                </label>
                <label className="workspace-checkbox">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
                  启用该服务
                </label>
                <div className="workspace-inline-actions">
                  <button type="button" onClick={() => void onUpdate()} disabled={submitting}>
                    {submitting ? "保存中..." : "保存配置"}
                  </button>
                  <button type="button" className="ghost-button ghost-button--inline ghost-button--danger" onClick={() => void onDelete()} disabled={submitting}>
                    删除配置
                  </button>
                </div>
              </div>
            ) : (
              <div className="workspace-empty-block">
                <p>选择左侧服务后可编辑配置、做发现与健康检查。</p>
              </div>
            )}
          </section>

          <section className="workspace-grid">
            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Discovery</p>
                  <h3>工具发现</h3>
                </div>
                {selectedServer ? (
                  <button type="button" className="ghost-button ghost-button--inline" onClick={() => void onDiscover(selectedServer.serverCode)}>
                    发现工具
                  </button>
                ) : null}
              </div>
              <div className="event-list">
                {(selectedServer ? discoveries[selectedServer.serverCode]?.tools ?? [] : []).map((tool) => (
                  <article key={tool.toolName} className="event-card">
                    <div className="event-card__header">
                      <strong>{tool.toolName}</strong>
                      <small>{tool.toolType}</small>
                    </div>
                    <p>{tool.description}</p>
                  </article>
                ))}
                {selectedServer && !discoveries[selectedServer.serverCode] ? (
                  <div className="workspace-empty-block">
                    <p>点击“发现工具”后，这里会展示工具清单和缓存结果。</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Health</p>
                  <h3>健康检查</h3>
                </div>
                {selectedServer ? (
                  <button type="button" className="ghost-button ghost-button--inline" onClick={() => void onHealth(selectedServer.serverCode)}>
                    检查健康
                  </button>
                ) : null}
              </div>
              {selectedServer && healthChecks[selectedServer.serverCode] ? (
                <div className="report-card">
                  <div className="report-card__header">
                    <strong>{healthChecks[selectedServer.serverCode].serverCode}</strong>
                    <span className="badge badge--soft">{healthChecks[selectedServer.serverCode].status}</span>
                  </div>
                  <p>{healthChecks[selectedServer.serverCode].message}</p>
                </div>
              ) : (
                <div className="workspace-empty-block">
                  <p>点击“检查健康”后，可看到当前服务的连通状态。</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
