import { AuthSession } from "../../stores/auth";
import { Button } from "../ui";

type UserMenuProps = {
  session: AuthSession | null;
  onLogout: () => void;
};

export function UserMenu({ session, onLogout }: UserMenuProps) {
  return (
    <>
      <div className="user-card">
        <span className="user-card__avatar" aria-hidden="true">{(session?.user.displayName ?? session?.user.username ?? "A").slice(0, 1).toUpperCase()}</span>
        <span className="user-card__copy"><strong>{session?.user.displayName ?? session?.user.username}</strong><small>{session?.user.roles.join(", ")}</small></span>
      </div>
      <Button type="button" variant="ghost" onClick={onLogout} fullWidth>退出登录</Button>
    </>
  );
}
