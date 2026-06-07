import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthSession } from "../../hooks/useAuthSession";
import { apiRequest } from "../../services/api";
import { Button } from "../ui";

const workNav = [
  { to: "/workspace/chat", label: "研究工作台" },
  { to: "/workspace/knowledge-bases", label: "知识库" },
  { to: "/workspace/image-generation", label: "图片工作室" },
  { to: "/workspace/history", label: "历史回放" }
];

const adminNav = [
  { to: "/admin/settings", label: "模型配置" },
  { to: "/admin/mcp-servers", label: "MCP 服务器" }
];

const titles: Record<string, string> = {
  "/workspace/chat": "研究工作台",
  "/workspace/knowledge-bases": "知识库",
  "/workspace/image-generation": "图片工作室",
  "/workspace/history": "历史回放",
  "/admin/settings": "模型配置",
  "/admin/mcp-servers": "MCP 服务器",
  "/account": "账号中心"
};

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    if (session?.accessToken) {
      await apiRequest<void>("/auth/logout", { method: "POST" }, session.accessToken).catch(() => undefined);
    }
    setSession(null);
    navigate("/login", { replace: true });
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside className="app-sidebar" aria-label="主导航">
        <Link className="app-brand" to="/workspace/chat" onClick={closeSidebar}>
          <span className="app-brand__mark">AI</span>
          <h1>AiAgent</h1>
          <p>Operations Console</p>
        </Link>

        <nav className="app-nav">
          <div className="app-nav__group">
            <span className="app-nav__label">工作区</span>
            {workNav.map((item) => (
              <NavLink key={item.to} to={item.to} className="app-nav__link" onClick={closeSidebar}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {session?.user.roles.includes("ADMIN") ? (
            <div className="app-nav__group">
              <span className="app-nav__label">系统</span>
              {adminNav.map((item) => (
                <NavLink key={item.to} to={item.to} className="app-nav__link" onClick={closeSidebar}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ) : null}

          <div className="app-nav__group">
            <span className="app-nav__label">账户</span>
            <NavLink to="/account" className="app-nav__link" onClick={closeSidebar}>账号中心</NavLink>
          </div>
        </nav>

        <div className="app-sidebar__footer">
          <div className="user-card">
            <strong>{session?.user.displayName ?? session?.user.username}</strong>
            <span>{session?.user.roles.join(", ")}</span>
          </div>
          <Button type="button" variant="ghost" onClick={() => void logout()} fullWidth>退出登录</Button>
        </div>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div className="cluster">
            <Button type="button" variant="ghost" size="sm" className="mobile-menu-button" onClick={() => setSidebarOpen((current) => !current)}>
              菜单
            </Button>
            <div>
              <p className="eyebrow">AiAgent V1</p>
              <h2>{titles[location.pathname] ?? "工作台"}</h2>
            </div>
          </div>
          <div className="topbar__actions">
            <span className="badge">Cmd/Ctrl K</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
