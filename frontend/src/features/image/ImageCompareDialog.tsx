import { ImageHistoryItem } from "../../services/api";
import { Badge, Button, Dialog, StatusPill } from "../../components/ui";

type ImageCompareDialogProps = {
  items: ImageHistoryItem[];
  isOpen: boolean;
  onClose: () => void;
};

export function ImageCompareDialog({ items, isOpen, onClose }: ImageCompareDialogProps) {
  const visibleItems = items.slice(0, 4);
  const hasOverflow = items.length > 4;

  return (
    <Dialog
      isOpen={isOpen}
      title="图片对比"
      description="并排查看选中图片的预览、状态和生成参数。"
      onClose={onClose}
      className="image-compare-dialog"
      footer={<Button type="button" variant="secondary" onClick={onClose}>关闭</Button>}
    >
      {hasOverflow ? <p className="image-compare-notice">超过 4 张时仅展示前 4 张，请减少选择以聚焦细节。</p> : null}
      <div className="image-compare-grid">
        {visibleItems.map((item, index) => (
          <article className="image-compare-card" key={item.jobId}>
            <div className="image-compare-card__header">
              <Badge tone="primary" className="tabular-nums">#{index + 1}</Badge>
              <StatusPill status={item.status} />
            </div>
            <div className="image-compare-card__frame">
              {item.resultUrl ? <img className="image-compare-card__image" src={item.resultUrl} alt={item.prompt} /> : (
                <div className="image-compare-card__placeholder">
                  <strong>暂无预览</strong>
                  <span>{item.errorMessage ?? "该任务没有可用图片链接。"}</span>
                </div>
              )}
            </div>
            <div className="image-compare-card__meta">
              <div>
                <span>模式</span>
                <strong>{item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</strong>
              </div>
              <div>
                <span>尺寸</span>
                <strong className="tabular-nums">{item.size}</strong>
              </div>
              <div>
                <span>时间</span>
                <strong className="tabular-nums">{formatDateTime(item.createdAt)}</strong>
              </div>
              <div>
                <span>会话</span>
                <strong className="id-text truncate-id" title={item.sessionId ?? "未挂接"}>{item.sessionId ?? "未挂接"}</strong>
              </div>
            </div>
            <p className="image-compare-card__prompt">{item.prompt}</p>
          </article>
        ))}
      </div>
    </Dialog>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
