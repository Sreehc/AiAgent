import { Link, NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "../ui";
import { accountNavigation, adminNavigation, NavigationItem, workNavigation } from "./navigation";

type SidebarProps = {
  isAdmin: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: () => void;
  footer: React.ReactNode;
};

function NavigationGroup({ label, items, collapsed, onNavigate }: { label: string; items: NavigationItem[]; collapsed: boolean; onNavigate: () => void }) {
  return (
    <div className="app-nav__group">
      <span className="app-nav__label">{label}</span>
      {items.map((item) => {
        const link = (
          <NavLink key={item.to} to={item.to} className="app-nav__link" onClick={onNavigate} aria-label={item.label}>
            <item.icon className="app-nav__icon" aria-hidden="true" />
            <span>{item.label}</span>
            <small>{item.shortLabel}</small>
          </NavLink>
        );
        return collapsed ? <Tooltip key={item.to} content={item.label} side="right">{link}</Tooltip> : link;
      })}
    </div>
  );
}

export function Sidebar({ isAdmin, collapsed, onToggleCollapsed, onNavigate, footer }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="主导航">
      <div className="app-sidebar__header">
        <Link className="app-brand" to="/workspace/chat" onClick={onNavigate} aria-label="AiAgent 研究工作台">
          <span className="app-brand__mark">AI</span>
          <span><strong>AiAgent</strong><small>Operations Console</small></span>
        </Link>
        <Tooltip content={collapsed ? "展开侧栏" : "收起侧栏"} side="right">
          <button type="button" className="sidebar-toggle" onClick={onToggleCollapsed} aria-label={collapsed ? "展开侧栏" : "收起侧栏"}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
        </Tooltip>
      </div>
      <nav className="app-nav">
        <NavigationGroup label="工作区" items={workNavigation} collapsed={collapsed} onNavigate={onNavigate} />
        {isAdmin ? <NavigationGroup label="系统" items={adminNavigation} collapsed={collapsed} onNavigate={onNavigate} /> : null}
        <NavigationGroup label="账户" items={accountNavigation} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>
      <div className="app-sidebar__footer">{footer}</div>
    </aside>
  );
}
