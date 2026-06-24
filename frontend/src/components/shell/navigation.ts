import type { LucideIcon } from "lucide-react";
import { Bot, Camera, ClipboardList, Database, Gauge, History, LayoutDashboard, ServerCog, Settings, UserCircle } from "lucide-react";

export type NavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  id: "workspace" | "admin" | "account";
  label: string;
  adminOnly?: boolean;
  items: NavigationItem[];
};

export const workNavigation: NavigationItem[] = [
  { to: "/workspace/chat", label: "研究工作台", shortLabel: "研究", icon: Bot },
  { to: "/workspace/knowledge-bases", label: "知识库", shortLabel: "知识", icon: Database },
  { to: "/workspace/image-generation", label: "图片工作室", shortLabel: "图片", icon: Camera },
  { to: "/workspace/history", label: "历史回放", shortLabel: "历史", icon: History }
];

export const adminNavigation: NavigationItem[] = [
  { to: "/admin/overview", label: "管理总览", shortLabel: "总览", icon: LayoutDashboard },
  { to: "/admin/settings", label: "模型配置", shortLabel: "模型", icon: Settings },
  { to: "/admin/mcp-servers", label: "MCP 服务器", shortLabel: "MCP", icon: ServerCog },
  { to: "/admin/audit", label: "审计", shortLabel: "审计", icon: ClipboardList },
  { to: "/admin/rag-evaluations", label: "RAG 评估", shortLabel: "评估", icon: Gauge }
];

export const accountNavigation: NavigationItem[] = [
  { to: "/account", label: "账号中心", shortLabel: "账号", icon: UserCircle }
];

export const navigationSections: NavigationSection[] = [
  { id: "workspace", label: "工作区", items: workNavigation },
  { id: "admin", label: "管理", adminOnly: true, items: adminNavigation },
  { id: "account", label: "账户", items: accountNavigation }
];

export const allNavigation = [...workNavigation, ...adminNavigation, ...accountNavigation];

export function getNavigationSections(isAdmin: boolean) {
  return navigationSections.filter((section) => !section.adminOnly || isAdmin);
}

export function findNavigationItem(pathname: string) {
  return allNavigation.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

export function findNavigationSection(pathname: string, isAdmin: boolean) {
  return getNavigationSections(isAdmin).find((section) =>
    section.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  );
}
