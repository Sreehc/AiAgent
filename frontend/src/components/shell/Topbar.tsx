import { useLocation } from "react-router-dom";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { Badge, Button, IconButton } from "../ui";
import { findNavigationItem, findNavigationSection } from "./navigation";
import { openCommandPalette } from "../command/commandEvents";
import { useTheme } from "../../hooks/useTheme";

type TopbarProps = {
  onOpenMenu: () => void;
  menuOpen: boolean;
  isAdmin: boolean;
};

export function Topbar({ onOpenMenu, menuOpen, isAdmin }: TopbarProps) {
  const location = useLocation();
  const current = findNavigationItem(location.pathname);
  const section = findNavigationSection(location.pathname, isAdmin);
  const { preference, theme, toggleTheme } = useTheme();
  const themeLabel = theme === "dark" ? "亮色" : "暗色";
  const themeToggleLabel = preference === "system"
    ? `当前跟随系统主题，切换到${themeLabel}主题`
    : `切换到${themeLabel}主题`;

  return (
    <header className="topbar">
      <div className="cluster">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mobile-menu-button"
          onClick={onOpenMenu}
          aria-label="打开主导航"
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>导航</span>
        </Button>
        <div className="topbar__context">
          <div className="topbar__location">
            <span>{section?.label ?? "Console"}</span>
            <strong>{current?.label ?? "AiAgent"}</strong>
          </div>
          {section ? <Badge tone={section.adminOnly ? "warning" : "neutral"}>{section.label}</Badge> : null}
        </div>
      </div>
      <div className="topbar__actions">
        <button type="button" className="command-trigger" aria-label="打开命令面板" onClick={openCommandPalette}>
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>搜索与跳转</span><kbd>⌘ K</kbd>
        </button>
        <IconButton
          label={themeToggleLabel}
          className="topbar__theme-toggle"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </IconButton>
      </div>
    </header>
  );
}
