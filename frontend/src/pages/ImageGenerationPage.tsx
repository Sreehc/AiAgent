import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert, Badge } from "../components/ui";
import { ImageGenerationForm, ImageFormState } from "../features/image/ImageGenerationForm";
import { ImageGallery } from "../features/image/ImageGallery";
import { ImageHistoryPanel } from "../features/image/ImageHistoryPanel";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, ImageGenerationItem, ImageHistoryItem, SessionItem } from "../services/api";
import { imagesApi } from "../services/imagesApi";

const DEFAULT_FORM: ImageFormState = {
  mode: "IMAGES",
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
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageStudioStats = useMemo(() => ({
    modeLabel: form.mode === "IMAGES" ? "文本生图" : "参考图编辑",
    historyCount: history.length,
    latestStatus: latestResult ? "已生成" : submitting ? "生成中" : "待生成"
  }), [form.mode, history.length, latestResult, submitting]);

  useEffect(() => {
    if (!session?.accessToken) return;
    void Promise.all([loadSessions(), loadHistory(1)]);
  }, [session?.accessToken]);

  async function loadSessions() {
    if (!session?.accessToken) return;
    try {
      const result = await imagesApi.listSessions(session.accessToken);
      setSessions(result.items);
      setForm((current) => ({ ...current, sessionId: current.sessionId || result.items[0]?.sessionId || "" }));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function loadHistory(pageNo: number) {
    if (!session?.accessToken) return;
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
    if (!session?.accessToken) return;
    setSubmitting(true);
    setError(null);
    setGenerationError(null);
    try {
      if (form.mode === "IMAGES") {
        setLatestResult(await imagesApi.generate(session.accessToken, { prompt: form.prompt, size: form.size, sessionId: form.sessionId || null }));
      } else {
        if (!referenceFile) {
          setGenerationError("请先上传参考图");
          setError("请先上传参考图");
          return;
        }
        const body = new FormData();
        body.append("prompt", form.prompt);
        body.append("size", form.size);
        if (form.sessionId) body.append("sessionId", form.sessionId);
        body.append("referenceImage", referenceFile);
        setLatestResult(await imagesApi.edit(session.accessToken, body));
      }
      await loadHistory(1);
    } catch (requestError) {
      setGenerationError((requestError as ApiError).message);
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page page--image-studio">
      <header className="page-header">
        <div>
          <h1>图片工作室</h1>
          <p>生成研究配图，或基于参考图片进行编辑并关联到会话产物。</p>
        </div>
        <div className="page-header__meta">
          <Badge tone="neutral">{form.size}</Badge>
          <Badge tone="neutral" className="tabular-nums">{imageStudioStats.historyCount} 条历史</Badge>
          <Badge tone="neutral">{imageStudioStats.latestStatus}</Badge>
        </div>
        <Badge>{imageStudioStats.modeLabel}</Badge>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="image-studio-layout">
        <aside className="image-studio-layout__controls" aria-label="图片生成参数">
          <ImageGenerationForm form={form} sessions={sessions} referenceFile={referenceFile} submitting={submitting} onFormChange={setForm} onReferenceFileChange={setReferenceFile} onSubmit={onSubmit} />
        </aside>
        <main className="image-studio-layout__main" aria-label="图片输出与历史">
          <ImageGallery result={latestResult} submitting={submitting} error={generationError} />
          <ImageHistoryPanel className="image-history-section" items={history} pageNo={historyPageNo} loading={loading} hasMore={hasMoreHistory} onPageChange={(page) => void loadHistory(page)} />
        </main>
      </div>
    </section>
  );
}
