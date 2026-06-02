export function WorkspacePage() {
  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">P0 基线</p>
          <h2>聊天工作台骨架</h2>
        </div>
        <span className="badge">SSE / 报告 / 知识库待接入</span>
      </header>
      <div className="workspace__panel">
        <div className="workspace__empty">
          <h3>工程骨架已就绪</h3>
          <p>
            当前阶段完成路由、布局、页面壳和样式基础设施，P2
            再接入真实会话与执行流。
          </p>
        </div>
      </div>
    </section>
  );
}

