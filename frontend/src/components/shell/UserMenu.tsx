import { ChevronsUpDown, LogOut } from "lucide-react";
import { AuthSession } from "../../stores/auth";
import { DropdownMenu } from "../ui";

type UserMenuProps = {
  session: AuthSession | null;
  onLogout: () => void;
};

export function UserMenu({ session, onLogout }: UserMenuProps) {
  const displayName = session?.user.displayName ?? session?.user.username ?? "AiAgent";
  const initial = displayName.slice(0, 1).toUpperCase();
  const roles = session?.user.roles.join(", ") ?? "";

  return (
    <DropdownMenu
      align="start"
      side="top"
      trigger={
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <strong className="truncate text-sm font-medium text-foreground">{displayName}</strong>
            <small className="truncate text-xs text-muted-foreground">{roles}</small>
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      }
      items={[
        {
          label: (
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              退出登录
            </span>
          ),
          tone: "danger",
          onSelect: onLogout
        }
      ]}
    />
  );
}
