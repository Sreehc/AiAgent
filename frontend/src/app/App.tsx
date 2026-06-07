import { useState } from "react";
import { AppRouter } from "../router/AppRouter";
import { ToastContainer } from "../components/Toast";
import { CommandPalette } from "../components/CommandPalette";
import { useKeyboard } from "../hooks/useKeyboard";

export function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // 全局快捷键：Cmd/Ctrl + K 打开命令面板
  useKeyboard([
    {
      key: 'k',
      metaKey: true,
      action: () => setCommandPaletteOpen(true),
      description: '打开命令面板'
    }
  ]);

  return (
    <>
      <AppRouter />
      <ToastContainer />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}

