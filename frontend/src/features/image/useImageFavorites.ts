import { useMemo, useState } from "react";

export const IMAGE_FAVORITES_STORAGE_KEY = "aiagent:image-favorites:v1";

type ImageFavoriteStorage = Pick<Storage, "getItem" | "setItem">;

function getImageFavoriteStorage(): ImageFavoriteStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readImageFavoriteIds(storage: ImageFavoriteStorage | null = getImageFavoriteStorage()) {
  if (!storage) return [];

  try {
    const raw = storage.getItem(IMAGE_FAVORITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

export function persistImageFavoriteIds(favoriteIds: string[], storage: ImageFavoriteStorage | null = getImageFavoriteStorage()) {
  if (!storage) return false;

  try {
    storage.setItem(IMAGE_FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(new Set(favoriteIds))));
    return true;
  } catch {
    return false;
  }
}

export function useImageFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readImageFavoriteIds());
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const favoriteCount = favoriteIds.length;

  function toggleFavorite(jobId: string) {
    setFavoriteIds((current) => {
      const next = current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId];
      const persisted = persistImageFavoriteIds(next);

      setFavoriteFeedback(next.includes(jobId) ? "已加入收藏" : "已取消收藏");
      if (!persisted) {
        setFavoriteFeedback("无法保存收藏，已保留本页临时状态");
      }

      return next;
    });
  }

  function isFavorite(jobId: string) {
    return favoriteIdSet.has(jobId);
  }

  return {
    favoriteIds,
    favoriteCount,
    favoriteFeedback,
    toggleFavorite,
    isFavorite
  };
}
