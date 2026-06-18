import type { LucideIcon } from "lucide-react";
import { Bot, Camera, ClipboardList, Database, Gauge, History, ServerCog, Settings, UserCircle } from "lucide-react";

export type NavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const workNavigation: NavigationItem[] = [
  { to: "/workspace/chat", label: "研究工作台", shortLabel: "研究", icon: Bot },
  { to: "/workspace/knowledge-bases", label: "知识库", shortLabel: "知识", icon: Database },
  { to: "/workspace/image-generation", label: "图片工作室", shortLabel: "图片", icon: Camera },
  { to: "/workspace/history", label: "历史回放", shortLabel: "历史", icon: History }
];

export const adminNavigation: NavigationItem[] = [
  { to: "/admin/settings", label: "模型配置", shortLabel: "模型", icon: Settings },
  { to: "/admin/mcp-servers", label: "MCP 服务器", shortLabel: "MCP", icon: ServerCog },
  { to: "/admin/audit", label: "审计", shortLabel: "审计", icon: ClipboardList },
  { to: "/admin/rag-evaluations", label: "RAG 评估", shortLabel: "评估", icon: Gauge }
];

export const accountNavigation: NavigationItem[] = [
  { to: "/account", label: "账号中心", shortLabel: "账号", icon: UserCircle }
];

export const allNavigation = [...workNavigation, ...adminNavigation, ...accountNavigation];
