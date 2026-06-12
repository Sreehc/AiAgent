import { ImageGenerationItem } from "../../services/api";
import { EmptyState, Panel, StatusPill } from "../../components/ui";

export function ImageGallery({ result }: { result: ImageGenerationItem | null }) {
  return (
    <Panel title="最新输出" eyebrow="Preview" action={result ? <StatusPill status="COMPLETED" /> : null}>
      {result?.resultUrl ? (
        <div className="image-stage">
          <div className="image-stage__preview-wrap"><img className="image-stage__preview" src={result.resultUrl} alt={result.title} /></div>
          <div className="meta-grid"><div className="meta-card"><span>任务</span><strong>{result.jobId}</strong></div><div className="meta-card"><span>模式</span><strong>{result.mode}</strong></div><div className="meta-card"><span>会话</span><strong>{result.sessionId ?? "-"}</strong></div></div>
          <a className="btn btn--secondary" href={result.resultUrl} target="_blank" rel="noreferrer">打开原图</a>
        </div>
      ) : <EmptyState title="暂无生成结果" message="提交文本生图或参考图编辑后，结果会出现在这里。" />}
    </Panel>
  );
}
