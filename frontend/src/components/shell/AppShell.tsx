import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthSession } from "../../hooks/useAuthSession";
import { authApi } from "../../services/authApi";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UserMenu } from "./UserMenu";

export function AppShell() {
  const navigate = useNavigate();
  const { session, setSession } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAdmin = session?.user.roles.includes("ADMIN") ?? false;
  const roleLabel = session?.user.roles.join(", ") ?? "USER";

  async function logout() {
    if (session?.accessToken) {
      await authApi.logout(session.accessToken).catch(() => undefined);
    }
    setSession(null);
    navigate("/login", { replace: true });
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div
      className={`app-shell ${sidebarOpen ? "sidebar-open" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      data-sidebar-state={sidebarCollapsed ? "collapsed" : "expanded"}
      data-admin={isAdmin || undefined}
    >
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <MobileNav isOpen={sidebarOpen} onClose={closeSidebar} />
      <Sidebar
        id="app-sidebar"
        isAdmin={isAdmin}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        onNavigate={closeSidebar}
        footer={<UserMenu session={session} onLogout={() => void logout()} />}
      />

      <main className="app-main">
        <Topbar onOpenMenu={() => setSidebarOpen(true)} menuOpen={sidebarOpen} roleLabel={roleLabel} isAdmin={isAdmin} />
        <div id="main-content"><Outlet /></div>
      </main>
    </div>
  );
}
