import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, Panel, Select, Textarea } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, ImageGenerationItem, ImageHistoryItem, SessionItem } from "../services/api";
import { imagesApi } from "../services/imagesApi";

type ImageMode = "IMAGES" | "EDITS";

const DEFAULT_FORM = {
  mode: "IMAGES" as ImageMode,
  prompt: "生成一张现代产业研究封面图，体现数据分析、能源网络和报告场景",
  size: "1024x1024",
  sessionId: ""
};

export function ImageGenerationPage() {
  const { session } = useAuthSession();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [historyPageNo, setHistoryPageNo] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [latestResult, setLatestResult] = useState<ImageGenerationItem | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSession = useMemo(() => sessions.find((item) => item.sessionId === form.sessionId) ?? null, [sessions, form.sessionId]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void Promise.all([loadSessions(), loadHistory(1)]);
  }, [session?.accessToken]);

  async function loadSessions() {
    if (!session?.accessToken) {
      return;
    }
    try {
      const result = await imagesApi.listSessions(session.accessToken);
      setSessions(result.items);
      setForm((current) => ({ ...current, sessionId: current.sessionId || result.items[0]?.sessionId || "" }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function loadHistory(pageNo = historyPageNo) {
    if (!session?.accessToken) {
      return;
    }
    setLoading(true);
    try {
      const result = await imagesApi.listHistory(session.accessToken, pageNo, 12);
      setHistory(result.items);
      setHistoryPageNo(result.pageNo);
      setHasMoreHistory(result.items.length === result.pageSize);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (form.mode === "IMAGES") {
        const generated = await imagesApi.generate(session.accessToken, { prompt: form.prompt, size: form.size, sessionId: form.sessionId || null });
        setLatestResult(generated);
      } else {
        if (!referenceFile) {
          setError("请先上传参考图");
          setSubmitting(false);
          return;
        }
        const body = new FormData();
        body.append("prompt", form.prompt);
        body.append("size", form.size);
        if (form.sessionId) {
          body.append("sessionId", form.sessionId);
        }
        body.append("referenceImage", referenceFile);
        const edited = await imagesApi.edit(session.accessToken, body);
        setLatestResult(edited);
      }
      await loadHistory(1);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>图片工作室</h1>
        <div className="page-header__meta">
          <span className="badge badge--neutral">{form.size}</span>
          <span className="badge badge--neutral">{history.length} 条历史</span>
        </div>
        <span className="badge">{form.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</span>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-grid content-grid--wide-side">
        <aside>
          <Panel title="生成参数" eyebrow="Controls">
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="segmented">
                <button type="button" className={form.mode === "IMAGES" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, mode: "IMAGES" }))}>文本生图</button>
                <button type="button" className={form.mode === "EDITS" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, mode: "EDITS" }))}>参考图编辑</button>
              </div>
              <Field label="Prompt"><Textarea rows={7} value={form.prompt} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))} /></Field>
              <div className="form-row">
                <Field label="尺寸"><Select value={form.size} onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}><option value="1024x1024">1024x1024</option><option value="1536x1024">1536x1024</option><option value="1024x1536">1024x1536</option></Select></Field>
                <Field label="挂接会话"><Select value={form.sessionId} onChange={(event) => setForm((current) => ({ ...current, sessionId: event.target.value }))}><option value="">不挂接会话</option>{sessions.map((item) => <option key={item.sessionId} value={item.sessionId}>{item.title}</option>)}</Select></Field>
              </div>
              {form.mode === "EDITS" ? <Field label="参考图"><Input type="file" accept="image/*" onChange={(event) => setReferenceFile(event.target.files?.[0] ?? null)} /></Field> : null}
              {selectedSession ? <Alert tone="info">当前会话：{selectedSession.title}。结果会同步出现在该会话的产物区。</Alert> : null}
              <Button type="submit" variant="primary" loading={submitting} fullWidth>{form.mode === "IMAGES" ? "生成图片" : "开始编辑"}</Button>
            </form>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title="最新输出" eyebrow="Preview" action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadHistory(historyPageNo)}>刷新历史</Button>}>
            {latestResult?.resultUrl ? (
              <div className="image-stage">
                <div className="image-stage__preview-wrap"><img className="image-stage__preview" src={latestResult.resultUrl} alt={latestResult.title} /></div>
                <div className="meta-grid">
                  <div className="meta-card"><span>任务</span><strong>{latestResult.jobId}</strong></div>
                  <div className="meta-card"><span>模式</span><strong>{latestResult.mode}</strong></div>
                  <div className="meta-card"><span>会话</span><strong>{latestResult.sessionId ?? "-"}</strong></div>
                </div>
                <a className="btn btn--secondary" href={latestResult.resultUrl} target="_blank" rel="noreferrer">打开原图</a>
              </div>
            ) : <EmptyState message="提交文本生图或参考图编辑后，结果会出现在这里。" />}
          </Panel>

          <Panel title="历史记录" eyebrow="History" action={<span className="badge">第 {historyPageNo} 页</span>}>
            <div className="cluster" style={{ marginBottom: "var(--space-4)" }}>
              <Button type="button" variant="secondary" disabled={historyPageNo <= 1 || loading} onClick={() => void loadHistory(historyPageNo - 1)}>上一页</Button>
              <Button type="button" variant="secondary" disabled={!hasMoreHistory || loading} onClick={() => void loadHistory(historyPageNo + 1)}>下一页</Button>
            </div>
            <div className="image-gallery">
              {history.map((item) => <ImageHistoryCard key={item.jobId} item={item} />)}
            </div>
            {!loading && history.length === 0 ? <EmptyState message="暂无图片生成历史。" /> : null}
          </Panel>
        </main>
      </div>
    </section>
  );
}

function ImageHistoryCard({ item }: { item: ImageHistoryItem }) {
  return (
    <article className="image-card">
      {item.resultUrl ? <img className="image-card__preview" src={item.resultUrl} alt={item.prompt} /> : <div className="image-card__placeholder">暂无预览</div>}
      <div className="image-card__body">
        <div className="split"><strong>{item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</strong><span className="badge">{item.status}</span></div>
        <p>{item.prompt}</p>
        <small className="muted">{item.size} · {formatDateTime(item.createdAt)}</small>
        <small className="muted">会话：{item.sessionId ?? "未挂接"}</small>
        {item.errorMessage ? <small className="muted">失败原因：{item.errorMessage}</small> : null}
        {item.resultUrl ? <a href={item.resultUrl} target="_blank" rel="noreferrer">打开结果</a> : null}
      </div>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
