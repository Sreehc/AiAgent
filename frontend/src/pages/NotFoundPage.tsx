import { Link } from "react-router-dom";
import { AuthLayout } from "../features/auth/AuthLayout";

export function NotFoundPage() {
  return (
    <AuthLayout
      eyebrow="404"
      title="页面不存在"
      intro="当前地址没有对应页面，请返回工作台继续操作。"
      contextTitle="Route Not Found"
      contextDescription="AiAgent 保留明确的页面边界，未知地址不会被静默重定向到登录页。"
      footer={<Link to="/login">返回登录</Link>}
    >
      <Link className="btn btn--primary btn--full" to="/workspace/chat">
        返回研究工作台
      </Link>
    </AuthLayout>
  );
}
