import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest } from "../services/api";

export function AppShell() {
  const navigate = useNavigate();
  const { session, setSession } = useAuthSession();

  async function logout() {
    if (session?.accessToken) {
      await apiRequest<void>(
        "/auth/logout",
        {
          method: "POST"
        },
        session.accessToken
      ).catch(() => undefined);
    }
    setSession(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div>
          <p className="eyebrow">AiAgent V1</p>
          <h1>Workspace</h1>
          <p className="muted shell__user">
            {session?.user.displayName} · {session?.user.roles.join(", ")}
          </p>
        </div>
        <nav className="shell__nav">
          <Link to="/workspace/chat">聊天研究</Link>
          <Link to="/account">账号中心</Link>
        </nav>
        <button className="ghost-button" type="button" onClick={logout}>
          退出登录
        </button>
      </aside>
      <main className="shell__content">
        <Outlet />
      </main>
    </div>
  );
}
