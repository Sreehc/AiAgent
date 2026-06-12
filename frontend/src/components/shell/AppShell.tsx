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
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <MobileNav isOpen={sidebarOpen} onClose={closeSidebar} />
      <Sidebar isAdmin={session?.user.roles.includes("ADMIN") ?? false} onNavigate={closeSidebar} footer={<UserMenu session={session} onLogout={() => void logout()} />} />

      <main className="app-main">
        <Topbar onOpenMenu={() => setSidebarOpen(true)} roleLabel={session?.user.roles.join(", ") ?? "USER"} />
        <div id="main-content"><Outlet /></div>
      </main>
    </div>
  );
}
