import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { AuthLayout } from "../features/auth/AuthLayout";
import { useAuthSession } from "../hooks/useAuthSession";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { session } = useAuthSession();
  const primaryTarget = session ? "/workspace/chat" : "/login";
  const primaryLabel = session ? "返回研究工作台" : "返回登录";
  const secondaryTarget = session ? "/login" : "/workspace/chat";
  const secondaryLabel = session ? "进入登录入口" : "查看研究工作台";

  return (
    <AuthLayout
      eyebrow="404"
      title="页面不存在"
      intro="当前地址没有对应页面，请选择一个明确入口继续。"
      contextTitle="Route Not Found"
      contextDescription="AiAgent 保留明确的页面边界，未知地址不会被静默重定向。"
    >
      <div className="not-found-panel" aria-label="404 返回路径">
        <div>
          <span className="not-found-code">404</span>
          <p>{session ? "账号仍处于登录状态，可直接回到研究工作台。" : "请先返回登录，之后继续进入研究工作台。"}</p>
        </div>
        <div className="not-found-actions">
          <Button type="button" variant="primary" size="lg" fullWidth onClick={() => navigate(primaryTarget)}>
            {primaryLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Link className="not-found-secondary" to={secondaryTarget}>
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
