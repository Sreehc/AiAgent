import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest } from "../services/api";

type Command = {
  id: string;
  label: string;
  description: string;
  path?: string;
  keywords: string[];
  adminOnly?: boolean;
  action?: "logout";
};

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
};

const COMMANDS: Command[] = [
  { id: "workspace", label: "研究工作台", description: "创建会话、运行任务、查看执行流", path: "/workspace/chat", keywords: ["chat", "research", "workspace", "研究"] },
  { id: "knowledge", label: "知识库", description: "管理文档、索引和检索测试", path: "/workspace/knowledge-bases", keywords: ["knowledge", "rag", "知识库"] },
  { id: "images", label: "图片工作室", description: "文本生图和参考图编辑", path: "/workspace/image-generation", keywords: ["image", "studio", "图片"] },
  { id: "history", label: "历史回放", description: "恢复会话、计划、工具和产物", path: "/workspace/history", keywords: ["history", "replay", "历史"] },
  { id: "account", label: "账号中心", description: "资料、安全和登录日志", path: "/account", keywords: ["account", "profile", "账号"] },
  { id: "settings", label: "模型配置", description: "管理模型和邀请码", path: "/admin/settings", keywords: ["admin", "model", "settings", "配置"], adminOnly: true },
  { id: "mcp", label: "MCP 服务器", description: "管理 MCP 服务、发现工具和健康检查", path: "/admin/mcp-servers", keywords: ["mcp", "server", "tool"], adminOnly: true },
  { id: "logout", label: "退出登录", description: "结束当前 session 并返回登录页", keywords: ["logout", "sign out", "退出"], action: "logout" }
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { session, setSession } = useAuthSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const isAdmin = session?.user.roles.includes("ADMIN") ?? false;

  const filteredCommands = useMemo(() => {
    const availableCommands = COMMANDS.filter((command) => {
      if (command.adminOnly && !isAdmin) {
        return false;
      }
      if (command.action === "logout" && !session) {
        return false;
      }
      return true;
    });
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return availableCommands;
    }
    return availableCommands.filter((command) => {
      return command.label.toLowerCase().includes(normalized)
        || command.description.toLowerCase().includes(normalized)
        || command.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
    });
  }, [isAdmin, query, session]);

  async function runCommand(command: Command) {
    if (command.action === "logout") {
      if (session?.accessToken) {
        await apiRequest<void>("/auth/logout", { method: "POST" }, session.accessToken).catch(() => undefined);
      }
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => filteredCommands.length === 0 ? 0 : (current + 1) % filteredCommands.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => filteredCommands.length === 0 ? 0 : (current - 1 + filteredCommands.length) % filteredCommands.length);
      }
      if (event.key === "Enter" && filteredCommands[activeIndex]) {
        event.preventDefault();
        void runCommand(filteredCommands[activeIndex]);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredCommands, isOpen, navigate, onClose, session?.accessToken, setSession]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="command-overlay" onClick={onClose} role="presentation">
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="命令面板" onClick={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索页面或操作"
        />
        <div className="command-palette__list">
          {filteredCommands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              className={`command-palette__item ${index === activeIndex ? "command-palette__item--active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => void runCommand(command)}
            >
              <strong>{command.label}</strong>
              <span className="muted">{command.description}</span>
            </button>
          ))}
          {filteredCommands.length === 0 ? <div className="empty-state"><p>没有匹配的命令。</p></div> : null}
        </div>
      </div>
    </div>
  );
}
