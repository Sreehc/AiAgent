import { useEffect, useMemo, useState } from "react";
import { ImageHistoryItem } from "../../services/api";

export function useImageSelection(items: ImageHistoryItem[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleIds = useMemo(() => items.map((item) => item.jobId), [items]);
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((jobId) => visibleIdSet.has(jobId)));
  }, [visibleIdSet]);

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  function enterSelectionMode() {
    setSelectionMode(true);
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  function toggleSelection(jobId: string) {
    setSelectedIds((current) => (current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]));
  }

  function selectAll() {
    setSelectionMode(true);
    setSelectedIds(visibleIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function isSelected(jobId: string) {
    return selectedIds.includes(jobId);
  }

  function getSelectionOrder(jobId: string) {
    const index = selectedIds.indexOf(jobId);
    return index >= 0 ? index + 1 : 0;
  }

  return {
    selectionMode,
    selectedIds,
    selectedCount,
    hasSelection,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectionOrder
  };
}
