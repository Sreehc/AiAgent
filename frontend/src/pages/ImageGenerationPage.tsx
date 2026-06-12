import { FormEvent, useEffect, useState } from "react";
import { Alert } from "../components/ui";
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
  const [error, setError] = useState<string | null>(null);

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
    try {
      if (form.mode === "IMAGES") {
        setLatestResult(await imagesApi.generate(session.accessToken, { prompt: form.prompt, size: form.size, sessionId: form.sessionId || null }));
      } else {
        if (!referenceFile) {
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
      setError((requestError as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>图片工作室</h1><p>生成研究配图，或基于参考图片进行编辑并关联到会话产物。</p></div><div className="page-header__meta"><span className="badge badge--neutral">{form.size}</span><span className="badge badge--neutral">{history.length} 条历史</span></div><span className="badge">{form.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</span></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="content-grid content-grid--wide-side">
        <aside><ImageGenerationForm form={form} sessions={sessions} referenceFile={referenceFile} submitting={submitting} onFormChange={setForm} onReferenceFileChange={setReferenceFile} onSubmit={onSubmit} /></aside>
        <main className="stack"><ImageGallery result={latestResult} /><ImageHistoryPanel items={history} pageNo={historyPageNo} loading={loading} hasMore={hasMoreHistory} onPageChange={(page) => void loadHistory(page)} /></main>
      </div>
    </section>
  );
}
