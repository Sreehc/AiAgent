import { createContext, useContext, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ImageHistoryItem } from "../../services/api";
import { Badge, Button, EmptyState, Pagination, Panel, Skeleton, StatusPill } from "../../components/ui";
import { ImageCompareDialog } from "./ImageCompareDialog";
import { useImageDownloads } from "./useImageDownloads";
import { useImageFavorites } from "./useImageFavorites";
import { useImageSelection } from "./useImageSelection";

type ImageHistoryPanelProps = {
  items: ImageHistoryItem[];
  pageNo: number;
  loading: boolean;
  hasMore: boolean;
  onPageChange: (pageNo: number) => void;
  className?: string;
};

const ImageHistoryCardContext = createContext<{
  isFavorite: (jobId: string) => boolean;
  toggleFavorite: (jobId: string) => void;
}>({
  isFavorite: () => false,
  toggleFavorite: () => undefined
});

export function ImageHistoryPanel({ items, pageNo, loading, hasMore, onPageChange, className }: ImageHistoryPanelProps) {
  const completedCount = items.filter((item) => item.status === "COMPLETED").length;
  const failedCount = items.filter((item) => item.status === "FAILED").length;
  const selection = useImageSelection(items);
  const favorites = useImageFavorites();
  const downloads = useImageDownloads();
  const [compareOpen, setCompareOpen] = useState(false);
  const selectedItems = items.filter((item) => selection.selectedIds.includes(item.jobId));
  const canCompare = selection.selectedCount >= 2;
  const hasDownloadableSelection = selectedItems.some((item) => Boolean(item.resultUrl));
  const compareDescription = selection.selectedCount > 4 ? "将对比前 4 张选中图片" : "选择 2 到 4 张图片进行对比";

  return (
    <section className={className}>
      <Panel title="历史记录" eyebrow="History" className="image-history-panel" action={<Badge className="tabular-nums">第 {pageNo} 页</Badge>}>
        <ImageHistoryCardContext.Provider value={{ isFavorite: favorites.isFavorite, toggleFavorite: favorites.toggleFavorite }}>
        <div className="image-history-toolbar">
          <div>
            <strong>历史缩略图</strong>
            <span className="muted">查看最近生成状态、尺寸和会话挂接。</span>
          </div>
          <div className="image-history-toolbar__stats">
            <Badge tone="neutral" className="tabular-nums">{items.length} 总数</Badge>
            <Badge tone="neutral" className="tabular-nums">{completedCount} 完成</Badge>
            <Badge tone="primary" className="tabular-nums">{favorites.favoriteCount} 收藏</Badge>
            {failedCount > 0 ? <Badge tone="danger" className="tabular-nums">{failedCount} 失败</Badge> : null}
          </div>
        </div>
        {favorites.favoriteFeedback ? <div className="image-history-feedback" aria-live="polite">{favorites.favoriteFeedback}</div> : null}
        <div className="image-selection-toolbar" data-selection-mode={selection.selectionMode || undefined}>
          <div className="image-selection-toolbar__summary">
            <strong className="tabular-nums">{selection.selectedCount} 已选</strong>
            <span className="muted">{selection.selectionMode ? compareDescription : "进入选择模式后可多选历史图片。"}</span>
          </div>
          <div className="image-selection-toolbar__actions">
            {selection.selectionMode ? (
              <Button type="button" variant="ghost" size="sm" onClick={selection.exitSelectionMode}>
                退出选择
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={selection.enterSelectionMode} disabled={items.length === 0 || loading}>
                选择
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={selection.selectAll} disabled={items.length === 0 || loading}>
              选择当前页
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCompareOpen(true)} disabled={!canCompare}>
              对比图片
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void downloads.downloadCollection(selectedItems)} disabled={!hasDownloadableSelection || downloads.downloading} loading={downloads.downloading}>
              下载集合
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={selection.clearSelection} disabled={!selection.hasSelection}>
              清空选择
            </Button>
          </div>
        </div>
        {downloads.downloadFeedback ? <div className="image-download-feedback" aria-live="polite">{downloads.downloadFeedback}</div> : null}
        {downloads.downloadFailures.length > 0 ? (
          <div className="image-download-fallback">
            <strong>无法直接下载的图片</strong>
            <div className="image-download-fallback__links">
              {downloads.downloadFailures.map((failure) => (
                <a key={failure.jobId} href={failure.url} target="_blank" rel="noreferrer">
                  {failure.jobId}：{failure.reason}
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <Pagination pageNo={pageNo} hasMore={hasMore} loading={loading} onChange={onPageChange} />
        {loading ? <Skeleton lines={3} /> : (
          <div className="image-history-grid">
            {items.map((item) => selection.selectionMode ? (
              <ImageHistorySelectableCard
                key={item.jobId}
                item={item}
                selectionMode={selection.selectionMode}
                selected={selection.isSelected(item.jobId)}
                selectionOrder={selection.getSelectionOrder(item.jobId)}
                onToggleSelection={selection.toggleSelection}
                favorite={favorites.isFavorite(item.jobId)}
                onToggleFavorite={favorites.toggleFavorite}
              />
            ) : <ImageHistoryCard key={item.jobId} item={item} />)}
          </div>
        )}
        {!loading && items.length === 0 ? <EmptyState title="暂无图片历史" message="生成第一张图片后，任务状态和结果会显示在这里。" /> : null}
        <ImageCompareDialog items={selectedItems} isOpen={compareOpen} onClose={() => setCompareOpen(false)} />
        </ImageHistoryCardContext.Provider>
      </Panel>
    </section>
  );
}

function ImageHistoryCard({ item }: { item: ImageHistoryItem }) {
  const cardContext = useContext(ImageHistoryCardContext);
  return <ImageHistorySelectableCard item={item} selectionMode={false} selected={false} selectionOrder={0} onToggleSelection={() => undefined} favorite={cardContext.isFavorite(item.jobId)} onToggleFavorite={cardContext.toggleFavorite} />;
}

type ImageHistorySelectableCardProps = {
  item: ImageHistoryItem;
  selectionMode: boolean;
  selected: boolean;
  selectionOrder: number;
  onToggleSelection: (jobId: string) => void;
  favorite: boolean;
  onToggleFavorite: (jobId: string) => void;
};

function ImageHistorySelectableCard({ item, selectionMode, selected, selectionOrder, onToggleSelection, favorite, onToggleFavorite }: ImageHistorySelectableCardProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const failureReason = item.errorMessage ?? "图片预览加载失败";
  const canPreview = Boolean(item.resultUrl) && !imageLoadFailed;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [item.resultUrl, item.jobId]);

  return (
    <article className="image-card" data-status={item.status.toLowerCase()} data-mode={item.mode.toLowerCase()} data-has-session={Boolean(item.sessionId) || undefined} data-selectable={selectionMode || undefined} data-selected={selected || undefined} data-favorite={favorite || undefined} aria-selected={selectionMode ? selected : undefined} aria-label={`图片历史：${item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}，${item.status}`}>
      <div className="image-card__media">
        <div className="image-card__frame">
          {canPreview ? <img className="image-card__preview" src={item.resultUrl ?? ""} alt={item.prompt} onError={() => setImageLoadFailed(true)} /> : (
            <div className="image-card__placeholder">
              <strong>暂无预览</strong>
              <span>{failureReason}</span>
            </div>
          )}
          <button type="button" className="image-card__favorite-button" aria-pressed={favorite} aria-label={favorite ? "取消收藏" : "收藏图片"} title={favorite ? "取消收藏" : "收藏图片"} onClick={() => onToggleFavorite(item.jobId)}>
            <Heart aria-hidden="true" />
          </button>
          {selectionMode ? (
            <label className="image-card__selection" aria-label={`选择图片 ${item.prompt}`}>
              <input type="checkbox" checked={selected} onChange={() => onToggleSelection(item.jobId)} />
              <span className="image-card__selection-indicator" aria-hidden="true">{selected ? selectionOrder : ""}</span>
            </label>
          ) : null}
          <div className="image-card__status">
            <StatusPill status={item.status} />
            <Badge tone="neutral">{item.mode === "IMAGES" ? "文本生图" : "参考图编辑"}</Badge>
            {favorite ? <Badge tone="primary">已收藏</Badge> : null}
          </div>
        </div>
      </div>
      <div className="image-card__body">
        <p className="image-card__prompt">{item.prompt}</p>
        <div className="image-card__metadata">
          <div className="image-card__metadata-item">
            <span>尺寸</span>
            <strong className="tabular-nums">{item.size}</strong>
          </div>
          <div className="image-card__metadata-item">
            <span>时间</span>
            <strong className="tabular-nums">{formatDateTime(item.createdAt)}</strong>
          </div>
          <div className="image-card__metadata-item">
            <span>会话</span>
            <strong className="id-text truncate-id image-card__session" title={item.sessionId ?? "未挂接"}>{item.sessionId ?? "未挂接"}</strong>
          </div>
        </div>
        {item.errorMessage || imageLoadFailed ? <small className="field__error">失败原因：{failureReason}</small> : null}
        <div className="image-card__actions">
          {item.resultUrl ? <a href={item.resultUrl} target="_blank" rel="noreferrer">打开结果</a> : <span className="muted">无结果链接</span>}
        </div>
      </div>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
