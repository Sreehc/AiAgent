import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, Panel } from "../../components/ui";

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
        <div className="auth-status-strip" aria-label="工作台能力状态">
          <Badge tone="info">Research-ready</Badge>
          <Badge tone="neutral">RAG</Badge>
          <Badge tone="neutral">MCP</Badge>
          <Badge tone="neutral">Artifacts</Badge>
        </div>
        {showCapabilities ? (
          <div className="auth-capability-list">
            <div className="auth-point"><strong>Research</strong><span>会话、执行流和报告产物</span></div>
            <div className="auth-point"><strong>Knowledge</strong><span>私有文档索引和检索测试</span></div>
            <div className="auth-point"><strong>Control</strong><span>模型、MCP 和账号配置</span></div>
          </div>
        ) : null}
      </section>
      <section className="auth-panel-wrap" aria-label="认证表单" aria-labelledby="auth-title">
        <Panel variant="raised" className="auth-card">
          <div className="auth-card__body">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="auth-title">{title}</h2>
            <p className="auth-card__intro">{intro}</p>
            {children}
            {footer ? <div className="auth-footer">{footer}</div> : null}
          </div>
        </Panel>
      </section>
    </main>
  );
}
