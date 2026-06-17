import { FormEvent, useEffect, useState } from "react";
import { Alert, Badge, Button, EmptyState, Field, Input, Panel, Switch, Textarea } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { adminApi } from "../services/adminApi";
import { ApiError, RagEvaluationCaseItem, RagEvaluationItem } from "../services/api";

const DEFAULT_CASES = JSON.stringify([
  { query: "示例问题", expectedCitationIds: [], expectedTextContains: ["示例"] }
], null, 2);

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

  useEffect(() => {
    if (session?.accessToken) void loadItems();
  }, [session?.accessToken]);

  async function loadItems() {
    if (!session?.accessToken) return;
    try {
      const [evaluations, evaluationCases] = await Promise.all([
        adminApi.listRagEvaluations(session.accessToken),
        adminApi.listRagEvaluationCases(session.accessToken)
      ]);
      setItems(evaluations);
      setCases(evaluationCases);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const enabledCases = cases.filter((item) => item.enabled).map((item) => ({ query: item.query, expectedCitationIds: item.expectedCitationIds, expectedTextContains: item.expectedTextContains }));
      const fallbackCases = JSON.parse(DEFAULT_CASES);
      await adminApi.createRagEvaluation(session.accessToken, {
        topK,
        knowledgeBaseIds: knowledgeBaseIds.split(",").map((item) => item.trim()).filter(Boolean),
        cases: enabledCases.length ? enabledCases : fallbackCases
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
    try {
      await adminApi.deleteRagEvaluationCase(session.accessToken, caseId);
      await loadItems();
    } catch (requestError) {
      setError((requestError as ApiError).message);
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
      <header className="page-header"><div><h1>RAG 评估</h1><p>运行检索回归用例并查看召回质量指标。</p></div><Badge>{items.length} 次评估</Badge></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="content-grid">
        <div className="stack">
          <Panel title="评估用例" eyebrow="Cases"><form className="form-grid" onSubmit={onCreateCase}><Field label="Query"><Input value={caseQuery} onChange={(event) => setCaseQuery(event.target.value)} required /></Field><Field label="期望文本，逗号分隔"><Textarea rows={3} value={caseExpectedText} onChange={(event) => setCaseExpectedText(event.target.value)} /></Field><Switch label="启用用例" checked={caseEnabled} onChange={(event) => setCaseEnabled(event.target.checked)} /><div className="button-row"><Button type="submit" variant="primary" loading={loading}>{editingCaseId ? "保存用例" : "新增用例"}</Button>{editingCaseId ? <Button type="button" variant="secondary" onClick={onCancelEdit}>取消编辑</Button> : null}</div></form><div className="table-list">{cases.map((item) => <article key={item.caseId} className="list-item"><div className="split"><strong>{item.query}</strong><Badge>{item.enabled ? "enabled" : "disabled"}</Badge></div><small>{item.expectedTextContains.join(", ") || "未配置期望文本"}</small><div className="button-row"><Button type="button" variant="secondary" size="sm" onClick={() => onEditCase(item)}>编辑</Button><Button type="button" variant="ghost" size="sm" onClick={() => void onDeleteCase(item.caseId)}>删除</Button></div></article>)}</div>{cases.length === 0 ? <EmptyState message="暂无评估用例。" /> : null}</Panel>
          <Panel title="新建评估" eyebrow="Evaluation"><form className="form-grid" onSubmit={onSubmit}><Field label="Knowledge Base IDs" description="逗号分隔，留空表示当前用户全部知识库。"><Input value={knowledgeBaseIds} onChange={(event) => setKnowledgeBaseIds(event.target.value)} placeholder="kb_xxx, kb_yyy" /></Field><Field label="Top K"><Input type="number" min={1} max={20} value={topK} onChange={(event) => setTopK(Number(event.target.value) || 10)} /></Field><Button type="submit" variant="primary" loading={loading}>使用已启用用例运行评估</Button></form></Panel>
        </div>
        <Panel title="评估历史" eyebrow="Metrics"><div className="table-list">{items.map((item) => <article key={item.evalId} className="list-item"><div className="split"><strong>{item.evalId}</strong><Badge>{item.status}</Badge></div><pre>{item.metrics}</pre><small>{item.createdAt}</small></article>)}</div>{items.length === 0 ? <EmptyState message="暂无评估记录。" /> : null}</Panel>
      </div>
    </section>
  );
}
