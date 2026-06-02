export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">AiAgent</p>
        <h1>登录工作台</h1>
        <p className="muted">
          P0 阶段提供登录入口壳，后续在 P1 对接认证流程。
        </p>
        <form className="auth-form">
          <label>
            用户名
            <input type="text" placeholder="alice" />
          </label>
          <label>
            密码
            <input type="password" placeholder="******" />
          </label>
          <button type="button">进入</button>
        </form>
      </div>
    </div>
  );
}

