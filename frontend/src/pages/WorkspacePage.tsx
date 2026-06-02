export function WorkspacePage() {
  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Research Workspace</p>
          <h2>聊天研究工作台</h2>
        </div>
        <span className="badge">认证链路已接入</span>
      </header>
      <div className="workspace__panel">
        <div className="workspace__empty">
          <h3>工作台主壳已开放</h3>
          <p>
            当前已经具备登录、邀请注册、账号中心和基础鉴权。下一步会继续接入真实会话、
            SSE 执行流、报告产物和知识库绑定。
          </p>
        </div>
      </div>
    </section>
  );
}
