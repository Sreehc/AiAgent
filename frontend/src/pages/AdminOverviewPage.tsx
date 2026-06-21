import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, DatabaseZap, RefreshCw, ServerCog, Settings2 } from "lucide-react";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Panel } from "../components/ui/Panel";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { AdminOverviewResponse, ApiError } from "../services/api";

export function AdminOverviewPage() {
  const { session } = useAuthSession();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user.roles.includes("ADMIN");

  useEffect(() => {
    if (session?.accessToken && isAdmin) {
      void loadOverview();
    } else {
      setLoading(false);
    }
  }, [session?.accessToken, isAdmin]);

  async function loadOverview() {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setOverview(await adminApi.getOverview(session.accessToken));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => overview, [overview]);

  if (!isAdmin) {
    return (
      <section className="page">
        <header className="page-header">
          <div>
            <h1>管理总览</h1>
            <p>聚合模型、MCP、审计和 RAG 风险状态。</p>
          </div>
          <Badge tone="neutral">Admin only</Badge>
        </header>
        <EmptyState variant="permission" title="需要管理员权限" message="当前账号没有管理员权限，无法访问管理总览。" />
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>管理总览</h1>
          <p>集中查看模型、MCP、审计和 RAG 评估风险，并跳转到对应模块处理。</p>
        </div>
        <div className="page-header__meta">
          <Badge tone={(summary?.totalRisks ?? 0) > 0 ? "warning" : "success"}>{summary?.totalRisks ?? 0} 个风险</Badge>
          <Badge tone="neutral">{loading ? "加载中" : "已同步"}</Badge>
        </div>
        <Button type="button" size="sm" loading={loading} onClick={() => void loadOverview()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          刷新
        </Button>
      </header>

      {error ? (
        <Alert tone="error" title="管理总览加载失败">
          {error}
        </Alert>
      ) : null}

      {!loading && summary && !summary.hasAnyData ? (
        <EmptyState variant="no-results" title="暂无管理数据" message="当前没有可展示的模型、MCP、审计或 RAG 评估数据。配置完成后这里会显示风险总览。" />
      ) : null}

      <div className="admin-overview-grid">
        <OverviewCard
          icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
          title="模型配置"
          metric={`${summary?.enabledModels ?? 0}/${summary?.totalModels ?? 0}`}
          label="启用 / 总数"
          tone={(summary?.modelRisks ?? 0) > 0 ? "warning" : "success"}
          description={summary?.defaultModel ? `默认模型：${summary.defaultModel.name}` : "尚未设置默认模型"}
          to="/admin/settings"
          action="查看模型"
          loading={loading}
        />
        <OverviewCard
          icon={<ServerCog className="h-5 w-5" aria-hidden="true" />}
          title="MCP 健康"
          metric={`${summary?.activeMcp ?? 0}/${summary?.totalMcp ?? 0}`}
          label="活跃 / 总数"
          tone={(summary?.mcpRisks ?? 0) > 0 ? "warning" : "success"}
          description={(summary?.mcpRisks ?? 0) > 0 ? `${summary?.mcpRisks ?? 0} 个服务未激活` : "服务状态正常"}
          to="/admin/mcp-servers"
          action="查看 MCP"
          loading={loading}
        />
        <OverviewCard
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          title="审计失败"
          metric={String(summary?.auditFailures ?? 0)}
          label="近期失败"
          tone={(summary?.auditFailures ?? 0) > 0 ? "danger" : "success"}
          description={`${summary?.failedRuns ?? 0} 个任务失败，${summary?.failedLogins ?? 0} 次登录失败`}
          to="/admin/audit"
          action="查看审计"
          loading={loading}
        />
        <OverviewCard
          icon={<DatabaseZap className="h-5 w-5" aria-hidden="true" />}
          title="RAG 评估"
          metric={String(summary?.ragFailures ?? 0)}
          label="失败评估"
          tone={(summary?.ragFailures ?? 0) > 0 ? "danger" : "success"}
          description={(summary?.ragFailures ?? 0) > 0 ? `${summary?.ragFailures ?? 0} 条评估失败` : "暂无失败评估"}
          to="/admin/rag-evaluations"
          action="查看评估"
          loading={loading}
        />
      </div>

      <div className="content-grid content-grid--wide-side">
        <Panel
          title="待处理风险"
          eyebrow="Risk queue"
          description="优先处理会影响真实用户任务的配置和运行异常。"
          className="admin-overview-risk-panel"
        >
          <ul className="admin-overview-risk-list">
            {(summary?.risks ?? []).map((risk) => (
              <li key={risk.id}>
                <div>
                  <span>{risk.title}</span>
                  <small>{risk.description}</small>
                </div>
                <Badge tone={risk.tone}>{risk.badge}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="快速入口" eyebrow="Drilldown" description="总览只做聚合，不替代详细配置。">
          <div className="admin-overview-actions">
            <Link to="/admin/settings">模型配置</Link>
            <Link to="/admin/mcp-servers">MCP 服务器</Link>
            <Link to="/admin/audit">审计记录</Link>
            <Link to="/admin/rag-evaluations">RAG 评估</Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function OverviewCard({
  icon,
  title,
  metric,
  label,
  tone,
  description,
  to,
  action,
  loading
}: {
  icon: React.ReactNode;
  title: string;
  metric: string;
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
  description: string;
  to: string;
  action: string;
  loading: boolean;
}) {
  return (
    <Panel className="admin-overview-card" state={loading ? "loading" : "default"}>
      <div className="admin-overview-card__top">
        <span className="admin-overview-card__icon">{icon}</span>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <div>
        <h2>{title}</h2>
        <p className="admin-overview-card__metric">{loading ? "..." : metric}</p>
        <p>{description}</p>
      </div>
      <Link className="text-action" to={to}>
        {action}
      </Link>
    </Panel>
  );
}
