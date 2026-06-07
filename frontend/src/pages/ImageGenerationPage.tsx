import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  apiRequest,
  ApiError,
  ImageGenerationItem,
  ImageHistoryItem,
  ImageHistoryResponse,
  SessionItem,
  SessionListResponse
} from "../services/api";

type ImageMode = "IMAGES" | "EDITS";

const DEFAULT_FORM = {
  mode: "IMAGES" as ImageMode,
  prompt: "生成一张现代产业研究封面图，带有橙青渐变、数据流线和报告感排版",
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

  const selectedSession = useMemo(
    () => sessions.find((item) => item.sessionId === form.sessionId) ?? null,
    [sessions, form.sessionId]
  );

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
      const result = await apiRequest<SessionListResponse>("/sessions?pageNo=1&pageSize=50", {}, session.accessToken);
      setSessions(result.items);
      setForm((current) => ({
        ...current,
        sessionId: current.sessionId || result.items[0]?.sessionId || ""
      }));
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
      const result = await apiRequest<ImageHistoryResponse>(`/images/history?pageNo=${pageNo}&pageSize=12`, {}, session.accessToken);
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
        const generated = await apiRequest<ImageGenerationItem>(
          "/images/generations",
          {
            method: "POST",
            body: JSON.stringify({
              prompt: form.prompt,
              size: form.size,
              sessionId: form.sessionId || null
            })
          },
          session.accessToken
        );
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
        const edited = await apiRequest<ImageGenerationItem>(
          "/images/edits",
          {
            method: "POST",
            body
          },
          session.accessToken
        );
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
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">视觉工作区</p>
          <h2>图片生成工作区</h2>
        </div>
        <span className="badge">{form.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>生成参数</h3>
            <form className="workspace-form" onSubmit={onSubmit}>
              <label>
                模式
                <select
                  value={form.mode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mode: event.target.value as ImageMode
                    }))
                  }
                >
                  <option value="IMAGES">文本生图</option>
                  <option value="EDITS">参考图编辑</option>
                </select>
              </label>
              <label>
                Prompt
                <textarea
                  rows={6}
                  value={form.prompt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      prompt: event.target.value
                    }))
                  }
                  placeholder="描述你要生成的视觉内容"
                />
              </label>
              <div className="workspace-form__row">
                <label>
                  尺寸
                  <select
                    value={form.size}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        size: event.target.value
                      }))
                    }
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1536x1024">1536x1024</option>
                    <option value="1024x1536">1024x1536</option>
                  </select>
                </label>
                <label>
                  挂接会话
                  <select
                    value={form.sessionId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sessionId: event.target.value
                      }))
                    }
                  >
                    <option value="">不挂接会话</option>
                    {sessions.map((item) => (
                      <option key={item.sessionId} value={item.sessionId}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {form.mode === "EDITS" ? (
                <label>
                  参考图
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setReferenceFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              ) : null}
              {selectedSession ? (
                <div className="workspace-empty-block">
                  <p>当前会话：{selectedSession.title}。生成结果会同步出现在该会话的产物区。</p>
                </div>
              ) : null}
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button type="submit" disabled={submitting}>
                {submitting ? "生成中..." : form.mode === "IMAGES" ? "生成图片" : "开始编辑"}
              </button>
            </form>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">最新输出</p>
                <h3>结果画廊</h3>
              </div>
              <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadHistory(historyPageNo)}>
                刷新历史
              </button>
            </div>

            {latestResult?.resultUrl ? (
              <div className="image-stage">
                <img className="image-stage__preview" src={latestResult.resultUrl} alt={latestResult.title} />
                <div className="result-meta">
                  <div>
                    <span className="muted">任务</span>
                    <strong>{latestResult.jobId}</strong>
                  </div>
                  <div>
                    <span className="muted">模式</span>
                    <strong>{latestResult.mode}</strong>
                  </div>
                  <div>
                    <span className="muted">挂接会话</span>
                    <strong>{latestResult.sessionId ?? "-"}</strong>
                  </div>
                </div>
                <div className="workspace-inline-actions">
                  <a className="ghost-button ghost-button--link" href={latestResult.resultUrl} target="_blank" rel="noreferrer">
                    打开原图
                  </a>
                  <span className="muted">下载链接为短期有效，如失效请刷新历史重新获取。</span>
                </div>
              </div>
            ) : (
              <div className="workspace-empty-block">
                <p>提交文本生图或参考图编辑后，结果会出现在这里。</p>
              </div>
            )}
          </section>

          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">历史记录</p>
                <h3>历史记录</h3>
              </div>
              <span className="muted">第 {historyPageNo} 页 · {history.length} 条</span>
            </div>

            <div className="workspace-inline-actions">
              <button type="button" className="ghost-button ghost-button--inline" disabled={historyPageNo <= 1 || loading} onClick={() => void loadHistory(historyPageNo - 1)}>
                上一页
              </button>
              <button type="button" className="ghost-button ghost-button--inline" disabled={!hasMoreHistory || loading} onClick={() => void loadHistory(historyPageNo + 1)}>
                下一页
              </button>
            </div>

            <div className="image-gallery">
              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="image-card image-card--skeleton">
                      <div className="image-card__preview image-card__preview--skeleton" />
                      <div className="image-card__body">
                        <div className="image-card__meta">
                          <div className="skeleton skeleton--text" style={{ width: "60px" }} />
                          <div className="skeleton skeleton--text" style={{ width: "40px" }} />
                        </div>
                        <div className="skeleton skeleton--text" style={{ width: "100%" }} />
                        <div className="skeleton skeleton--text" style={{ width: "70%" }} />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                history.map((item) => (
                  <article key={item.jobId} className="image-card">
                    {item.resultUrl ? (
                      <img className="image-card__preview" src={item.resultUrl} alt={item.prompt} />
                    ) : (
                      <div className="image-card__placeholder">暂无预览</div>
                    )}
                    <div className="image-card__body">
                      <div className="image-card__meta">
                        <strong>{item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</strong>
                        <span>{item.status === "COMPLETED" ? "已完成" : item.status === "FAILED" ? "失败" : "处理中"}</span>
                      </div>
                      <p>{item.prompt}</p>
                      <small>
                        {item.size} · {formatDateTime(item.createdAt)}
                      </small>
                      <small>会话：{item.sessionId ?? "未挂接"}</small>
                      {item.errorMessage ? <small>失败原因：{item.errorMessage}</small> : null}
                      {item.resultUrl ? (
                        <a href={item.resultUrl} target="_blank" rel="noreferrer">
                          打开结果
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
              {!loading && history.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有图片任务，先生成一张研究封面图或插图。</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
