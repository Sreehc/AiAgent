import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Badge, Button, IconButton } from "../ui";
import { allNavigation } from "./navigation";
import { openCommandPalette } from "../command/commandEvents";
import { useTheme } from "../../hooks/useTheme";

type TopbarProps = {
  onOpenMenu: () => void;
  roleLabel: string;
};

export function Topbar({ onOpenMenu, roleLabel }: TopbarProps) {
  const location = useLocation();
  const current = allNavigation.find((item) => item.to === location.pathname);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="cluster">
        <Button type="button" variant="ghost" size="sm" className="mobile-menu-button" onClick={onOpenMenu} aria-label="打开主导航">菜单</Button>
        <div className="topbar__location">
          <span>Console</span>
          <strong>{current?.label ?? "AiAgent"}</strong>
        </div>
      </div>
      <div className="topbar__actions">
        <button type="button" className="command-trigger" aria-label="打开命令面板" onClick={openCommandPalette}>
          <span>搜索与跳转</span><kbd>⌘ K</kbd>
        </button>
        <IconButton
          label={theme === "dark" ? "切换到亮色主题" : "切换到暗色主题"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </IconButton>
        <Badge tone="neutral">{roleLabel}</Badge>
      </div>
    </header>
  );
}
