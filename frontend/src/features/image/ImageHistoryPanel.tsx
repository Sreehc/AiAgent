import { ImageHistoryItem } from "../../services/api";
import { Badge, Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";

type ImageHistoryPanelProps = {
  items: ImageHistoryItem[];
  pageNo: number;
  loading: boolean;
  hasMore: boolean;
  onPageChange: (pageNo: number) => void;
};

export function ImageHistoryPanel({ items, pageNo, loading, hasMore, onPageChange }: ImageHistoryPanelProps) {
  return (
    <Panel title="历史记录" eyebrow="History" action={<Badge>第 {pageNo} 页</Badge>}>
      <div className="cluster image-history-actions"><Button type="button" variant="secondary" disabled={pageNo <= 1 || loading} onClick={() => onPageChange(pageNo - 1)}>上一页</Button><Button type="button" variant="secondary" disabled={!hasMore || loading} onClick={() => onPageChange(pageNo + 1)}>下一页</Button></div>
      {loading ? <Skeleton lines={3} /> : (
        <div className="image-gallery">
          {items.map((item) => <article key={item.jobId} className="image-card">{item.resultUrl ? <img className="image-card__preview" src={item.resultUrl} alt={item.prompt} /> : <div className="image-card__placeholder">暂无预览</div>}<div className="image-card__body"><div className="split"><strong>{item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</strong><StatusPill status={item.status} /></div><p>{item.prompt}</p><small className="muted">{item.size} · {formatDateTime(item.createdAt)}</small><small className="muted">会话：{item.sessionId ?? "未挂接"}</small>{item.errorMessage ? <small className="field__error">失败原因：{item.errorMessage}</small> : null}{item.resultUrl ? <a href={item.resultUrl} target="_blank" rel="noreferrer">打开结果</a> : null}</div></article>)}
        </div>
      )}
      {!loading && items.length === 0 ? <EmptyState title="暂无图片历史" message="生成第一张图片后，任务状态和结果会显示在这里。" /> : null}
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
