import { useEffect, useState } from "react";
import { ImageGenerationItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";

type ImageGalleryProps = {
  result: ImageGenerationItem | null;
  submitting: boolean;
  error: string | null;
};

export function ImageGallery({ result, submitting, error }: ImageGalleryProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const hasImage = Boolean(result?.resultUrl) && !imageLoadFailed;
  const stageState = submitting ? "loading" : error || (result && !result.resultUrl) || imageLoadFailed ? "error" : result ? "ready" : "empty";

  useEffect(() => {
    setImageLoadFailed(false);
  }, [result?.resultUrl, result?.jobId]);

  return (
    <Panel title="最新输出" eyebrow="Preview" className="image-preview-panel" state={submitting ? "loading" : error ? "error" : "default"} action={result ? <StatusPill status="COMPLETED" /> : <Badge tone="neutral">Preview</Badge>}>
      <div className={`image-stage image-stage--${stageState}`}>
        <div className="image-stage__preview-wrap">
          {submitting ? <Skeleton variant="card" label="正在生成图片" /> : null}
          {!submitting && hasImage ? <img className="image-stage__preview" src={result?.resultUrl ?? ""} alt={result?.title ?? "生成图片"} onError={() => setImageLoadFailed(true)} /> : null}
          {!submitting && !hasImage && !error && !result ? (
            <div className="image-stage__placeholder">
              <strong>等待生成</strong>
              <span>提交文本生图或参考图编辑后，最新输出会显示在这里。</span>
            </div>
          ) : null}
          {!submitting && (error || (result && !result.resultUrl) || imageLoadFailed) ? (
            <div className="image-stage__error">
              <strong>图片暂不可预览</strong>
              <span>{error ?? "图片预览加载失败。"}</span>
              {result?.resultUrl ? <a href={result.resultUrl} target="_blank" rel="noreferrer">打开原图</a> : null}
            </div>
          ) : null}
        </div>
        {result ? (
          <div className="image-stage__meta">
            <div className="meta-card"><span>任务</span><strong className="id-text truncate-id" title={result.jobId}>{result.jobId}</strong></div>
            <div className="meta-card"><span>模式</span><strong>{result.mode}</strong></div>
            <div className="meta-card"><span>尺寸</span><strong className="tabular-nums">{result.size}</strong></div>
            <div className="meta-card"><span>会话</span><strong className="id-text truncate-id" title={result.sessionId ?? "未挂接"}>{result.sessionId ?? "-"}</strong></div>
            <div className="meta-card"><span>生成时间</span><strong className="tabular-nums">{formatDateTime(result.createdAt)}</strong></div>
          </div>
        ) : null}
        <div className="image-stage__actions">
          {result?.resultUrl ? <a className="not-found-secondary" href={result.resultUrl} target="_blank" rel="noreferrer">打开原图</a> : null}
          {!result ? <EmptyState title="暂无生成结果" message="左侧参数会保留输入，生成中也不会清空当前配置。" /> : null}
          {result ? <Button type="button" variant="ghost" size="sm" onClick={() => void copyImageInfo(result)}>复制任务信息</Button> : null}
        </div>
      </div>
    </Panel>
  );
}

async function copyImageInfo(result: ImageGenerationItem) {
  const text = `${result.title}\njobId: ${result.jobId}\nsize: ${result.size}\nurl: ${result.resultUrl ?? "-"}`;
  await navigator.clipboard?.writeText(text);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
