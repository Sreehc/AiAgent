import { Link, Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div>
          <p className="eyebrow">AiAgent V1</p>
          <h1>Workspace</h1>
        </div>
        <nav className="shell__nav">
          <Link to="/workspace/chat">聊天研究</Link>
        </nav>
      </aside>
      <main className="shell__content">
        <Outlet />
      </main>
    </div>
  );
}

