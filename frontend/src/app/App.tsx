import { useEffect, useMemo, useState } from "react";
import { AppRouter } from "../router/AppRouter";
import { ToastContainer } from "../components/Toast";
import { CommandPalette } from "../components/command/CommandPalette";
import { OPEN_COMMAND_PALETTE_EVENT, openCommandPalette } from "../components/command/commandEvents";
import { useKeyboard } from "../hooks/useKeyboard";

export function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const shortcuts = useMemo(() => [
    {
      key: 'k',
      metaKey: true,
      action: openCommandPalette,
      description: '打开命令面板'
    }
  ], []);
  useKeyboard(shortcuts);

  useEffect(() => {
    const open = () => setCommandPaletteOpen(true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
  }, []);

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
