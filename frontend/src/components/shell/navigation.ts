export type NavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
};

export const workNavigation: NavigationItem[] = [
  { to: "/workspace/chat", label: "研究工作台", shortLabel: "研究" },
  { to: "/workspace/knowledge-bases", label: "知识库", shortLabel: "知识" },
  { to: "/workspace/image-generation", label: "图片工作室", shortLabel: "图片" },
  { to: "/workspace/history", label: "历史回放", shortLabel: "历史" }
];

export const adminNavigation: NavigationItem[] = [
  { to: "/admin/settings", label: "模型配置", shortLabel: "模型" },
  { to: "/admin/mcp-servers", label: "MCP 服务器", shortLabel: "MCP" }
];

export const accountNavigation: NavigationItem[] = [
  { to: "/account", label: "账号中心", shortLabel: "账号" }
];

export const allNavigation = [...workNavigation, ...adminNavigation, ...accountNavigation];
