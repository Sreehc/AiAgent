import { Link, NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "../ui";
import { cn } from "@/lib/utils";
import { getNavigationSections, NavigationItem, NavigationSection } from "./navigation";

type SidebarProps = {
  id?: string;
  isAdmin: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: () => void;
  footer: React.ReactNode;
};

function NavigationGroup({ section, collapsed, onNavigate }: { section: NavigationSection; collapsed: boolean; onNavigate: () => void }) {
  return (
    <section className="app-nav__group" data-admin-only={section.adminOnly || undefined} aria-label={section.label}>
      <div className="app-nav__section-heading">
        <span className="app-nav__label">{section.label}</span>
        <span className="app-nav__count">{section.items.length}</span>
      </div>
      {section.items.map((item) => {
        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn("app-nav__link", isActive && "app-nav__link--active")}
            onClick={onNavigate}
            aria-label={collapsed ? item.label : undefined}
          >
            <item.icon className="app-nav__icon" aria-hidden="true" />
            <span>{item.label}</span>
            <small>{item.shortLabel}</small>
          </NavLink>
        );
        return collapsed ? <Tooltip key={item.to} content={item.label} side="right">{link}</Tooltip> : link;
      })}
    </section>
  );
}

export function Sidebar({ id, isAdmin, collapsed, onToggleCollapsed, onNavigate, footer }: SidebarProps) {
  const sections = getNavigationSections(isAdmin);

  return (
    <aside id={id} className="app-sidebar" aria-label="主导航" data-collapsed={collapsed || undefined}>
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
        {sections.map((section) => (
          <NavigationGroup key={section.id} section={section} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="app-sidebar__footer">{footer}</div>
    </aside>
  );
}
