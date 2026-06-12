import { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  intro: string;
  contextTitle: string;
  contextDescription: string;
  children: ReactNode;
  footer?: ReactNode;
  showCapabilities?: boolean;
};

export function AuthLayout({ eyebrow, title, intro, contextTitle, contextDescription, children, footer, showCapabilities = false }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-context" aria-label="产品简介">
        <Link className="auth-brand" to="/login"><span className="app-brand__mark">AI</span><strong>AiAgent</strong></Link>
        <h1>{contextTitle}</h1>
        <p>{contextDescription}</p>
        {showCapabilities ? (
          <div className="auth-points">
            <div className="auth-point"><strong>Research</strong><span>会话、执行流和报告产物</span></div>
            <div className="auth-point"><strong>Knowledge</strong><span>私有文档索引和检索测试</span></div>
            <div className="auth-point"><strong>Control</strong><span>模型、MCP 和账号配置</span></div>
          </div>
        ) : null}
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="auth-title">{title}</h2>
        <p className="auth-card__intro">{intro}</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>
    </main>
  );
}
