import { Link, NavLink } from "react-router-dom";
import { accountNavigation, adminNavigation, NavigationItem, workNavigation } from "./navigation";

type SidebarProps = {
  isAdmin: boolean;
  onNavigate: () => void;
  footer: React.ReactNode;
};

function NavigationGroup({ label, items, onNavigate }: { label: string; items: NavigationItem[]; onNavigate: () => void }) {
  return (
    <div className="app-nav__group">
      <span className="app-nav__label">{label}</span>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="app-nav__link" onClick={onNavigate}>
          <span>{item.label}</span>
          <small>{item.shortLabel}</small>
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar({ isAdmin, onNavigate, footer }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="主导航">
      <Link className="app-brand" to="/workspace/chat" onClick={onNavigate}>
        <span className="app-brand__mark">AI</span>
        <span><strong>AiAgent</strong><small>Operations Console</small></span>
      </Link>
      <nav className="app-nav">
        <NavigationGroup label="工作区" items={workNavigation} onNavigate={onNavigate} />
        {isAdmin ? <NavigationGroup label="系统" items={adminNavigation} onNavigate={onNavigate} /> : null}
        <NavigationGroup label="账户" items={accountNavigation} onNavigate={onNavigate} />
      </nav>
      <div className="app-sidebar__footer">{footer}</div>
    </aside>
  );
}
