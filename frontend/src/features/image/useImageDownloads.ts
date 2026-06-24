import { useState } from "react";
import { ImageHistoryItem } from "../../services/api";

type ImageDownloadFailure = {
  jobId: string;
  url: string;
  reason: string;
};

function getImageDownloadFilename(item: ImageHistoryItem) {
  const safeJobId = item.jobId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const safeSize = item.size.replace(/[^a-zA-Z0-9_-]/g, "-");
  const extension = getImageExtension(item.resultUrl);
  return `aiagent-${item.mode.toLowerCase()}-${safeSize}-${safeJobId}.${extension}`;
}

function getImageExtension(url: string | null) {
  if (!url) return "png";

  try {
    const pathname = new URL(url, window.location.href).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    return match?.[1]?.toLowerCase() ?? "png";
  } catch {
    return "png";
  }
}

async function downloadImageItem(item: ImageHistoryItem) {
  if (!item.resultUrl) {
    throw new Error("缺少图片链接");
  }

  const response = await fetch(item.resultUrl);
  if (!response.ok) {
    throw new Error(`下载失败：${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = getImageDownloadFilename(item);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function useImageDownloads() {
  const [downloading, setDownloading] = useState(false);
  const [downloadFailures, setDownloadFailures] = useState<ImageDownloadFailure[]>([]);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  async function downloadCollection(items: ImageHistoryItem[]) {
    const downloadableItems = items.filter((item) => Boolean(item.resultUrl));

    if (downloadableItems.length === 0) {
      setDownloadFailures([]);
      setDownloadFeedback("没有可下载的图片链接");
      return;
    }

    setDownloading(true);
    setDownloadFailures([]);
    setDownloadFeedback(`正在下载 ${downloadableItems.length} 张图片...`);

    try {
      const failures: ImageDownloadFailure[] = [];

      for (const item of downloadableItems) {
        try {
          await downloadImageItem(item);
        } catch (error) {
          failures.push({
            jobId: item.jobId,
            url: item.resultUrl ?? "",
            reason: error instanceof Error ? error.message : "下载失败"
          });
        }
      }

      setDownloadFailures(failures);
      if (failures.length > 0) {
        setDownloadFeedback("部分图片无法直接下载，请使用下方链接打开");
      } else {
        setDownloadFeedback(`已开始下载 ${downloadableItems.length} 张图片`);
      }
    } finally {
      setDownloading(false);
    }
  }

  return {
    downloading,
    downloadFailures,
    downloadFeedback,
    downloadCollection
  };
}
