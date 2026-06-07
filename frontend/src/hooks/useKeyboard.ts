import { useEffect } from "react";

type KeyBinding = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
};

/**
 * 键盘快捷键 Hook
 *
 * @example
 * useKeyboard([
 *   { key: 'k', metaKey: true, action: () => openCommandPalette(), description: '打开命令面板' },
 *   { key: 'Escape', action: () => closeDialog(), description: '关闭对话框' }
 * ]);
 */
export function useKeyboard(bindings: KeyBinding[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      for (const binding of bindings) {
        const metaMatch = binding.metaKey === undefined || binding.metaKey === (event.metaKey || event.ctrlKey);
        const ctrlMatch = binding.ctrlKey === undefined || binding.ctrlKey === event.ctrlKey;
        const shiftMatch = binding.shiftKey === undefined || binding.shiftKey === event.shiftKey;
        const altMatch = binding.altKey === undefined || binding.altKey === event.altKey;
        const keyMatch = binding.key === event.key;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          binding.action();
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings]);
}

/**
 * 快捷键显示辅助函数
 * 根据操作系统显示正确的修饰键符号
 */
export function getShortcutDisplay(binding: Omit<KeyBinding, 'action'>): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (binding.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (binding.ctrlKey && !binding.metaKey) {
    parts.push('Ctrl');
  }
  if (binding.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (binding.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // 格式化按键显示
  const keyDisplay = binding.key === ' ' ? 'Space' :
                     binding.key === 'Escape' ? 'Esc' :
                     binding.key.length === 1 ? binding.key.toUpperCase() :
                     binding.key;

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}
