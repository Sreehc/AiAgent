import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { useAuthSession } from "../../hooks/useAuthSession";
import { authApi } from "../../services/authApi";

type CommandEntry = {
  id: string;
  label: string;
  description: string;
  path?: string;
  keywords: string[];
  adminOnly?: boolean;
  action?: "logout";
  group: string;
};

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

const COMMANDS: CommandEntry[] = [
  { id: "workspace", label: "研究工作台", description: "创建会话、运行任务、查看执行流", path: "/workspace/chat", keywords: ["chat", "research", "workspace", "研究"], group: "工作区" },
  { id: "knowledge", label: "知识库", description: "管理文档、索引和检索测试", path: "/workspace/knowledge-bases", keywords: ["knowledge", "rag", "知识库"], group: "工作区" },
  { id: "images", label: "图片工作室", description: "文本生图和参考图编辑", path: "/workspace/image-generation", keywords: ["image", "studio", "图片"], group: "工作区" },
  { id: "history", label: "历史回放", description: "恢复会话、计划、工具和产物", path: "/workspace/history", keywords: ["history", "replay", "历史"], group: "工作区" },
  { id: "account", label: "账号中心", description: "资料、安全和登录日志", path: "/account", keywords: ["account", "profile", "账号"], group: "账户" },
  { id: "settings", label: "模型配置", description: "管理模型和邀请码", path: "/admin/settings", keywords: ["admin", "model", "settings", "配置"], adminOnly: true, group: "系统" },
  { id: "mcp", label: "MCP 服务器", description: "管理 MCP 服务、发现工具和健康检查", path: "/admin/mcp-servers", keywords: ["mcp", "server", "tool"], adminOnly: true, group: "系统" },
  { id: "logout", label: "退出登录", description: "结束当前 session 并返回登录页", keywords: ["logout", "sign out", "退出"], action: "logout", group: "账户" }
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { session, setSession } = useAuthSession();
  const isAdmin = session?.user.roles.includes("ADMIN") ?? false;

  const available = COMMANDS.filter(
    (command) => (!command.adminOnly || isAdmin) && (command.action !== "logout" || session)
  );
  const groups = Array.from(new Set(available.map((command) => command.group)));

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function runCommand(command: CommandEntry) {
    if (command.action === "logout") {
      if (session?.accessToken) await authApi.logout(session.accessToken).catch(() => undefined);
      setSession(null);
      navigate("/login", { replace: true });
      onClose();
      return;
    }
    if (command.path) {
      navigate(command.path);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[50] flex items-start justify-center bg-foreground/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <Command
        label="命令面板"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Command.Input
          autoFocus
          placeholder="搜索页面或操作"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
            没有匹配的命令。
          </Command.Empty>
          {groups.map((group) => (
            <Command.Group
              key={group}
              heading={group}
              className="text-xs font-semibold text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {available
                .filter((command) => command.group === group)
                .map((command) => (
                  <Command.Item
                    key={command.id}
                    value={`${command.label} ${command.description} ${command.keywords.join(" ")}`}
                    onSelect={() => void runCommand(command)}
                    className="flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-sm text-foreground outline-none data-[selected=true]:bg-muted"
                  >
                    <strong className="font-medium">{command.label}</strong>
                    <span className="text-xs text-muted-foreground">{command.description}</span>
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
