import { FormEvent, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Panel,
  StatusPill,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableExpandedRow,
  TableHead,
  TableHeader,
  TableLoading,
  TableRow,
  Textarea
} from "../components/ui";
import { JsonBlock } from "../features/workspace/JsonBlock";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { ApiError, RagEvaluationCaseItem, RagEvaluationItem, RagMetricsSummary } from "../services/api";

type BadgeTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info";

type ParsedMetrics = {
  parsed: Record<string, unknown> | null;
  parseError: boolean;
  summary: string;
  values: {
    hitRate: unknown;
    recall: unknown;
    precision: unknown;
    mrr: unknown;
    ndcg: unknown;
    passed: unknown;
    failed: unknown;
  };
  failedCases: unknown[];
};

type EvaluationCaseSnapshot = {
  query?: string;
  enabled?: boolean;
  expectedCitationIds?: unknown;
  expectedTextContains?: unknown;
  recentResult?: unknown;
  failureReason?: unknown;
};

const metricCardLabels: Array<{ key: keyof ParsedMetrics["values"]; label: string }> = [
  { key: "hitRate", label: "Hit Rate" },
  { key: "recall", label: "Recall" },
  { key: "precision", label: "Precision" },
  { key: "mrr", label: "MRR" },
  { key: "ndcg", label: "NDCG" }
];

export function RagEvaluationPage() {
  const { session } = useAuthSession();
  const [items, setItems] = useState<RagEvaluationItem[]>([]);
  const [cases, setCases] = useState<RagEvaluationCaseItem[]>([]);
  const [topK, setTopK] = useState(10);
  const [knowledgeBaseIds, setKnowledgeBaseIds] = useState("");
  const [caseQuery, setCaseQuery] = useState("示例问题");
  const [caseExpectedText, setCaseExpectedText] = useState("示例");
  const [caseEnabled, setCaseEnabled] = useState(true);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) void loadItems();
  }, [session?.accessToken]);

  const latestEvaluation = items[0] ?? null;
  const latestMetrics = useMemo(() => parseRagMetrics(latestEvaluation?.metrics ?? "", latestEvaluation?.metricsSummary), [latestEvaluation?.metrics, latestEvaluation?.metricsSummary]);
  const summary = useMemo(() => getEvaluationSummary(items, cases, latestMetrics), [items, cases, latestMetrics]);

  async function loadItems() {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [evaluations, evaluationCases] = await Promise.all([
        adminApi.listRagEvaluations(session.accessToken),
        adminApi.listRagEvaluationCases(session.accessToken)
      ]);
      setItems(evaluations);
      setCases(evaluationCases);
      setExpandedEvalId(null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    const enabledCases = cases.filter((item) => item.enabled).map((item) => ({ query: item.query, expectedCitationIds: item.expectedCitationIds, expectedTextContains: item.expectedTextContains }));
    if (enabledCases.length === 0) {
      setError("请先创建并启用至少一个评估用例。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminApi.createRagEvaluation(session.accessToken, {
        topK,
        knowledgeBaseIds: knowledgeBaseIds.split(",").map((item) => item.trim()).filter(Boolean),
        cases: enabledCases
      });
      await loadItems();
    } catch (requestError) {
      setError((requestError as ApiError).message ?? "评估用例 JSON 格式错误");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        query: caseQuery,
        expectedCitationIds: [],
        expectedTextContains: caseExpectedText.split(",").map((item) => item.trim()).filter(Boolean),
        enabled: caseEnabled
      };
      if (editingCaseId) {
        await adminApi.updateRagEvaluationCase(session.accessToken, editingCaseId, payload);
      } else {
        await adminApi.createRagEvaluationCase(session.accessToken, payload);
      }
      setCaseQuery("");
      setCaseExpectedText("");
      setCaseEnabled(true);
      setEditingCaseId(null);
      await loadItems();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteCase(caseId: string) {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      await adminApi.deleteRagEvaluationCase(session.accessToken, caseId);
      await loadItems();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  function onEditCase(item: RagEvaluationCaseItem) {
    setEditingCaseId(item.caseId);
    setCaseQuery(item.query);
    setCaseExpectedText(item.expectedTextContains.join(", "));
    setCaseEnabled(item.enabled);
  }

  function onCancelEdit() {
    setEditingCaseId(null);
    setCaseQuery("");
    setCaseExpectedText("");
    setCaseEnabled(true);
  }

  if (!session?.user.roles.includes("ADMIN")) return <section className="page"><header className="page-header"><h1>RAG 评估</h1><Badge tone="neutral">Admin only</Badge></header><EmptyState message="当前账号没有管理员权限。" /></section>;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>RAG 评估</h1>
          <p>运行检索回归用例并查看召回质量指标。</p>
        </div>
        <Badge>{items.length} 次评估</Badge>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="rag-evaluation-summary">
        <SummaryCard label="评估总数" value={summary.totalEvaluations} helper={`${summary.failedEvaluations} 次失败`} tone={summary.failedEvaluations > 0 ? "danger" : "neutral"} />
        <SummaryCard label="最新状态" value={summary.latestStatus} helper={latestEvaluation ? formatEvaluationDate(latestEvaluation.createdAt) : "暂无记录"} tone={getEvaluationTone(summary.latestStatus)} />
        <SummaryCard label="已启用用例" value={summary.enabledCases} helper={`${cases.length} 条用例`} tone="info" />
        <SummaryCard label="最新 Hit Rate" value={summary.latestHitRate} helper={latestMetrics.parseError ? "metrics 解析失败" : "来自最近一次评估"} tone={latestMetrics.parseError ? "warning" : "success"} />
      </div>
      <div className="content-grid">
        <div className="stack">
          <Panel title="评估用例" eyebrow="Cases">
            <form className="form-grid" onSubmit={onCreateCase}>
              <Field label="Query"><Input value={caseQuery} onChange={(event) => setCaseQuery(event.target.value)} required /></Field>
              <Field label="期望文本，逗号分隔"><Textarea rows={3} value={caseExpectedText} onChange={(event) => setCaseExpectedText(event.target.value)} /></Field>
              <Switch label="启用用例" checked={caseEnabled} onChange={(event) => setCaseEnabled(event.target.checked)} />
              <div className="button-row">
                <Button type="submit" variant="primary" loading={loading}>{editingCaseId ? "保存用例" : "新增用例"}</Button>
                {editingCaseId ? <Button type="button" variant="secondary" onClick={onCancelEdit}>取消编辑</Button> : null}
              </div>
            </form>
            {renderCaseTable({ cases, loading, onEditCase, onDeleteCase })}
          </Panel>
          <Panel title="新建评估" eyebrow="Evaluation">
            <form className="form-grid" onSubmit={onSubmit}>
              <Field label="Knowledge Base IDs" description="逗号分隔，留空表示当前用户全部知识库。"><Input value={knowledgeBaseIds} onChange={(event) => setKnowledgeBaseIds(event.target.value)} placeholder="kb_xxx, kb_yyy" /></Field>
              <Field label="Top K"><Input type="number" min={1} max={20} value={topK} onChange={(event) => setTopK(Number(event.target.value) || 10)} /></Field>
              <Button type="submit" variant="primary" loading={loading}>使用已启用用例运行评估</Button>
            </form>
          </Panel>
        </div>
        <Panel title="评估历史" eyebrow="Metrics">
          <div className="stack">
            {latestMetrics.parseError ? <div className="rag-metrics-parse-warning" role="note">最近一次 metrics 结构化解析失败，已保留原始 metrics 详情。</div> : null}
            {renderMetricCards(latestMetrics)}
            {renderEvaluationHistoryTable({ items, loading, expandedEvalId, setExpandedEvalId })}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, helper, tone }: { label: string; value: ReactNode; helper: string; tone: BadgeTone }) {
  return (
    <article className="rag-metric-card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function renderMetricCards(metrics: ParsedMetrics) {
  return (
    <div className="rag-metric-card-grid" aria-label="RAG 指标详情">
      {metricCardLabels.map((metric) => (
        <article key={metric.key} className="rag-metric-card">
          <span>{metric.label}</span>
          <strong>{formatMetricValue(metrics.values[metric.key])}</strong>
          <small>{metrics.parseError ? "解析失败" : metrics.summary}</small>
        </article>
      ))}
      <article className="rag-metric-card" data-tone={numberish(metrics.values.failed) > 0 ? "danger" : "success"}>
        <span>失败用例</span>
        <strong>{formatMetricValue(metrics.values.failed)}</strong>
        <small>{metrics.failedCases.length ? `${metrics.failedCases.length} 条详情` : "无结构化失败列表"}</small>
      </article>
    </div>
  );
}

function renderCaseTable({
  cases,
  loading,
  onEditCase,
  onDeleteCase
}: {
  cases: RagEvaluationCaseItem[];
  loading: boolean;
  onEditCase: (item: RagEvaluationCaseItem) => void;
  onDeleteCase: (caseId: string) => void;
}) {
  return (
    <Table className="rag-case-table" density="compact" minWidth="920px">
      <TableHeader>
        <TableRow>
          <TableHead>Query</TableHead>
          <TableHead status>启用</TableHead>
          <TableHead>期望 citation</TableHead>
          <TableHead>期望文本</TableHead>
          <TableHead>最近结果</TableHead>
          <TableHead>失败原因</TableHead>
          <TableHead align="right">操作</TableHead>
        </TableRow>
      </TableHeader>
      {loading ? <TableLoading columns={7} rows={4} /> : null}
      {!loading && cases.length === 0 ? <TableEmpty colSpan={7}><EmptyState message="暂无评估用例。" /></TableEmpty> : null}
      {!loading && cases.length > 0 ? (
        <TableBody>
          {cases.map((item) => (
            <TableRow key={item.caseId} disabled={!item.enabled}>
              <TableCell className="rag-table-cell rag-table-cell--wide"><span title={item.query}>{item.query}</span></TableCell>
              <TableCell status><StatusPill status={item.enabled ? "ENABLED" : "DISABLED"} /></TableCell>
              <TableCell className="rag-table-cell"><span title={item.expectedCitationIds.join(", ")}>{formatList(item.expectedCitationIds)}</span></TableCell>
              <TableCell className="rag-table-cell rag-table-cell--wide"><span title={item.expectedTextContains.join(", ")}>{formatList(item.expectedTextContains)}</span></TableCell>
              <TableCell className="rag-table-cell"><span>{formatCaseRecentResult(item)}</span></TableCell>
              <TableCell className="rag-table-cell rag-table-cell--wide"><span>{formatCaseFailureReason(item)}</span></TableCell>
              <TableCell align="right">
                <div className="button-row button-row--end">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onEditCase(item)}>编辑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void onDeleteCase(item.caseId)}>删除</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      ) : null}
    </Table>
  );
}

function renderEvaluationHistoryTable({
  items,
  loading,
  expandedEvalId,
  setExpandedEvalId
}: {
  items: RagEvaluationItem[];
  loading: boolean;
  expandedEvalId: string | null;
  setExpandedEvalId: (evalId: string | null) => void;
}) {
  return (
    <Table className="rag-evaluation-table" density="compact" minWidth="1160px">
      <TableHeader>
        <TableRow>
          <TableHead>Eval ID</TableHead>
          <TableHead status>状态</TableHead>
          <TableHead numeric>Top K</TableHead>
          <TableHead numeric>知识库</TableHead>
          <TableHead numeric>用例</TableHead>
          <TableHead numeric>通过/失败</TableHead>
          <TableHead>主要指标</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead align="right">详情</TableHead>
        </TableRow>
      </TableHeader>
      {loading ? <TableLoading columns={9} rows={5} /> : null}
      {!loading && items.length === 0 ? <TableEmpty colSpan={9}><EmptyState message="暂无评估记录。" /></TableEmpty> : null}
      {!loading && items.length > 0 ? (
        <TableBody>
          {items.map((item) => {
            const metrics = parseRagMetrics(item.metrics, item.metricsSummary);
            const evaluationCases = parseEvaluationCases(item.cases);
            const knowledgeBases = parseKnowledgeBaseIds(item.knowledgeBaseIds);
            const isExpanded = expandedEvalId === item.evalId;
            return (
              <Fragment key={item.evalId}>
                <TableRow expanded={isExpanded}>
                  <TableCell className="rag-table-cell"><span className="id-text truncate-id" title={item.evalId}>{item.evalId}</span></TableCell>
                  <TableCell status><StatusPill status={item.status} /></TableCell>
                  <TableCell numeric>{formatMetricValue(getMetricValue(metrics.parsed, ["topK", "top_k", "top_k_value"]))}</TableCell>
                  <TableCell numeric>{knowledgeBases.length}</TableCell>
                  <TableCell numeric>{evaluationCases.length}</TableCell>
                  <TableCell numeric>{formatPassFail(metrics)}</TableCell>
                  <TableCell className="rag-table-cell rag-table-cell--wide"><span title={formatMainMetrics(metrics)}>{formatMainMetrics(metrics)}</span></TableCell>
                  <TableCell className="rag-table-cell"><span title={item.createdAt}>{formatEvaluationDate(item.createdAt)}</span></TableCell>
                  <TableCell align="right">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setExpandedEvalId(expandedEvalId === item.evalId ? null : item.evalId)}>
                      {isExpanded ? "收起" : "展开"}
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableExpandedRow colSpan={9}>
                    {renderEvaluationDetails(item, metrics, evaluationCases, knowledgeBases)}
                  </TableExpandedRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      ) : null}
    </Table>
  );
}

function renderEvaluationDetails(item: RagEvaluationItem, metrics: ParsedMetrics, evaluationCases: EvaluationCaseSnapshot[], knowledgeBases: string[]) {
  return (
    <div className="stack">
      {metrics.parseError ? <div className="rag-metrics-parse-warning" role="note">metrics 解析失败，以下保留原始 metrics 内容。</div> : null}
      <div className="rag-detail-grid">
        <DetailItem label="Eval ID" value={item.evalId} />
        <DetailItem label="状态" value={item.status} />
        <DetailItem label="知识库" value={knowledgeBases.length ? knowledgeBases.join(", ") : "全部或未指定"} />
        <DetailItem label="用例数量" value={evaluationCases.length} />
        <DetailItem label="通过/失败" value={formatPassFail(metrics)} />
        <DetailItem label="完成时间" value={item.completedAt ? formatEvaluationDate(item.completedAt) : "-"} />
      </div>
      {renderCaseSnapshotTable(evaluationCases)}
      <div className="rag-detail-grid">
        {metricCardLabels.map((metric) => <DetailItem key={metric.key} label={metric.label} value={formatMetricValue(metrics.values[metric.key])} />)}
        <DetailItem label="失败用例" value={metrics.failedCases.length ? `${metrics.failedCases.length} 条` : formatMetricValue(metrics.values.failed)} />
      </div>
      {item.errorMessage ? <Alert tone="error" title="评估错误">{item.errorMessage}</Alert> : null}
      <JsonBlock payload={item.metrics} label="原始 metrics" summary={metrics.summary} />
      <JsonBlock payload={item.cases} label="原始评估用例" summary={`${evaluationCases.length} 条用例`} />
    </div>
  );
}

function renderCaseSnapshotTable(cases: EvaluationCaseSnapshot[]) {
  if (cases.length === 0) {
    return <EmptyState message="本次评估没有结构化用例快照。" />;
  }

  return (
    <Table className="rag-case-table" density="compact" minWidth="880px">
      <TableHeader>
        <TableRow>
          <TableHead>Query</TableHead>
          <TableHead status>启用</TableHead>
          <TableHead>期望 citation</TableHead>
          <TableHead>期望文本</TableHead>
          <TableHead>最近结果</TableHead>
          <TableHead>失败原因</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((item, index) => (
          <TableRow key={`${formatMetricValue(item.query)}-${index}`}>
            <TableCell className="rag-table-cell rag-table-cell--wide"><span title={formatMetricValue(item.query)}>{formatMetricValue(item.query)}</span></TableCell>
            <TableCell status><StatusPill status={item.enabled === false ? "DISABLED" : "ENABLED"} /></TableCell>
            <TableCell className="rag-table-cell"><span>{formatUnknownList(item.expectedCitationIds)}</span></TableCell>
            <TableCell className="rag-table-cell rag-table-cell--wide"><span>{formatUnknownList(item.expectedTextContains)}</span></TableCell>
            <TableCell className="rag-table-cell"><span>{formatMetricValue(item.recentResult)}</span></TableCell>
            <TableCell className="rag-table-cell rag-table-cell--wide"><span>{formatMetricValue(item.failureReason)}</span></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rag-detail-grid__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function parseRagMetrics(metrics: string, metricsSummary?: RagMetricsSummary | null): ParsedMetrics {
  const emptyValues = {
    hitRate: undefined,
    recall: undefined,
    precision: undefined,
    mrr: undefined,
    ndcg: undefined,
    passed: undefined,
    failed: undefined
  };

  if (metricsSummary) {
    const summaryObject = {
      topK: metricsSummary.topK,
      caseCount: metricsSummary.caseCount,
      passedCount: metricsSummary.passedCount,
      failedCount: metricsSummary.failedCount,
      noResultCount: metricsSummary.noResultCount,
      recallAt5: metricsSummary.recallAt5,
      recallAt10: metricsSummary.recallAt10,
      mrr: metricsSummary.mrr,
      citationHitRate: metricsSummary.citationHitRate,
      noResultRate: metricsSummary.noResultRate
    };
    return {
      parsed: summaryObject,
      parseError: false,
      summary: "后端结构化 metrics",
      values: {
        hitRate: metricsSummary.citationHitRate,
        recall: metricsSummary.recallAt10,
        precision: undefined,
        mrr: metricsSummary.mrr,
        ndcg: undefined,
        passed: metricsSummary.passedCount,
        failed: metricsSummary.failedCount
      },
      failedCases: []
    };
  }

  if (!metrics?.trim()) {
    return { parsed: null, parseError: false, summary: "暂无 metrics", values: emptyValues, failedCases: [] };
  }

  try {
    const parsed = JSON.parse(metrics) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { parsed: null, parseError: false, summary: "非对象 metrics", values: emptyValues, failedCases: [] };
    }

    const parsedObject = parsed as Record<string, unknown>;
    return {
      parsed: parsedObject,
      parseError: false,
      summary: `${Object.keys(parsedObject).length} 个字段`,
      values: {
        hitRate: getMetricValue(parsedObject, ["hitRate", "hit_rate", "hit-rate", "hit", "hitRatePct"]),
        recall: getMetricValue(parsedObject, ["recall", "recallRate", "recall_rate"]),
        precision: getMetricValue(parsedObject, ["precision", "precisionRate", "precision_rate"]),
        mrr: getMetricValue(parsedObject, ["mrr", "meanReciprocalRank", "mean_reciprocal_rank"]),
        ndcg: getMetricValue(parsedObject, ["ndcg", "nDCG", "normalizedDiscountedCumulativeGain"]),
        passed: getMetricValue(parsedObject, ["passed", "passedCount", "passCount", "passed_cases"]),
        failed: getMetricValue(parsedObject, ["failed", "failedCount", "failCount", "failed_cases_count"])
      },
      failedCases: normalizeArray(getMetricValue(parsedObject, ["failedCases", "failed_cases", "failures", "failedCaseList"]))
    };
  } catch {
    return { parsed: null, parseError: true, summary: "结构化解析失败", values: emptyValues, failedCases: [] };
  }
}

function getMetricValue(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return undefined;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  const normalizedMap = new Map(Object.entries(source).map(([key, value]) => [normalizeKey(key), value]));
  for (const key of keys) {
    const value = normalizedMap.get(normalizeKey(key));
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
}

function parseEvaluationCases(cases: string): EvaluationCaseSnapshot[] {
  if (!cases?.trim()) return [];
  try {
    const parsed = JSON.parse(cases) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => item && typeof item === "object" ? item as EvaluationCaseSnapshot : { query: formatMetricValue(item) });
  } catch {
    return [];
  }
}

function parseKnowledgeBaseIds(value: string) {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getEvaluationSummary(items: RagEvaluationItem[], cases: RagEvaluationCaseItem[], latestMetrics: ParsedMetrics) {
  const latest = items[0];
  return {
    totalEvaluations: items.length,
    failedEvaluations: items.filter((item) => getEvaluationTone(item.status) === "danger").length,
    latestStatus: latest?.status ?? "暂无",
    enabledCases: cases.filter((item) => item.enabled).length,
    latestHitRate: formatMetricValue(latestMetrics.values.hitRate)
  };
}

function getEvaluationTone(status: string): BadgeTone {
  const normalized = status.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "SUCCESS" || normalized === "ENABLED") return "success";
  if (normalized.includes("FAIL") || normalized === "ERROR" || normalized === "DISABLED") return "danger";
  if (normalized === "RUNNING" || normalized === "PENDING") return "info";
  if (normalized === "暂无") return "neutral";
  return "neutral";
}

function formatMetricValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    if (value >= 0 && value <= 1) return `${(value * 100).toFixed(1)}%`;
    return value.toFixed(3);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value.length > 64 ? `${value.slice(0, 64)}...` : value;
  if (Array.isArray(value)) return `${value.length} items`;
  return "object";
}

function formatEvaluationDate(value: unknown) {
  const text = formatMetricValue(value);
  if (text === "-") return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function formatMainMetrics(metrics: ParsedMetrics) {
  const entries = metricCardLabels
    .map((item) => `${item.label}: ${formatMetricValue(metrics.values[item.key])}`)
    .filter((item) => !item.endsWith(": -"))
    .slice(0, 3);
  if (entries.length) return entries.join(" · ");
  return metrics.parseError ? "metrics 解析失败" : metrics.summary;
}

function formatPassFail(metrics: ParsedMetrics) {
  return `${formatMetricValue(metrics.values.passed)} / ${formatMetricValue(metrics.values.failed)}`;
}

function formatList(values: string[]) {
  return values.length ? values.join(", ") : "-";
}

function formatUnknownList(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.map(formatMetricValue).join(", ") : "-";
  return formatMetricValue(value);
}

function formatCaseRecentResult(item: RagEvaluationCaseItem) {
  const dynamicItem = item as RagEvaluationCaseItem & { recentResult?: unknown; lastResult?: unknown; result?: unknown };
  return formatMetricValue(dynamicItem.recentResult ?? dynamicItem.lastResult ?? dynamicItem.result);
}

function formatCaseFailureReason(item: RagEvaluationCaseItem) {
  const dynamicItem = item as RagEvaluationCaseItem & { failureReason?: unknown; errorMessage?: unknown; reason?: unknown };
  return formatMetricValue(dynamicItem.failureReason ?? dynamicItem.errorMessage ?? dynamicItem.reason);
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) return value;
  return [];
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function numberish(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
