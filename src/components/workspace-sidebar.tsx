import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Columns3,
  Flag,
  Inbox,
  Mountain,
  UserRound,
} from "lucide-react";
import type { PlannerView, WorkspaceData } from "../lib/model";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  useSidebar,
} from "./ui/sidebar";

type WorkspaceDialog = "account";
const planningViews = [
  { view: "horizons", label: "Horizons", icon: Columns3 },
  { view: "inbox", label: "Inbox", icon: Inbox },
  { view: "days", label: "Days", icon: CalendarDays },
  { view: "weeks", label: "Weeks", icon: CalendarRange },
  { view: "months", label: "Months", icon: Calendar },
  { view: "years", label: "Years", icon: Flag },
] as const;

export function WorkspaceSidebar({
  user,
  view,
  onNavigate,
  onLife,
  onDialog,
}: {
  user: WorkspaceData["user"];
  view: PlannerView;
  onNavigate: (view: PlannerView) => void;
  onLife: () => void;
  onDialog: (dialog: WorkspaceDialog) => void;
}) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const expanded = isMobile || state === "expanded";
  const accountName = user?.name || user?.email || "Sign in";
  const initials = user?.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("") || user?.email.slice(0, 2);

  function act(action: () => void) {
    setOpenMobile(false);
    action();
  }
  function showDialog(dialog: WorkspaceDialog) {
    act(() => onDialog(dialog));
  }

  return (
    <Sidebar
      collapsible="icon"
      className="workspace-sidebar min-h-0"
      role="navigation"
      aria-label="Workspace tools"
    >
      <SidebarHeader className="h-[59px] shrink-0 px-2 py-0">
        <Button
          type="button"
          variant="ghost"
          className="workspace-account-button"
          aria-label={user ? "Your account" : "Sign in"}
          aria-haspopup="dialog"
          title={accountName}
          onClick={() => showDialog("account")}
        >
          <span className="workspace-account-icon" aria-hidden="true">
            <Avatar className="shadow-none transition-colors hover:translate-x-0 hover:translate-y-0 hover:shadow-none">
              {user?.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="text-sm">
                {initials || <UserRound />}
              </AvatarFallback>
            </Avatar>
          </span>
          {expanded && <span className="workspace-account-label">{accountName}</span>}
        </Button>
      </SidebarHeader>
      <SidebarContent className="min-h-0 space-y-6 overflow-x-hidden p-2">
        <SidebarGroup>
          {planningViews.map(({ view: target, label, icon: Icon }) => (
            <SidebarItem
              key={target}
              type="button"
              icon={<Icon />}
              tooltip={label}
              aria-label={label}
              variant={view === target ? "active" : "default"}
              className={`workspace-sidebar-item ${view === target ? "text-accent-foreground" : ""}`}
              aria-current={view === target ? "page" : undefined}
              onClick={() => act(() => onNavigate(target))}
            >
              {label}
            </SidebarItem>
          ))}
          <SidebarItem
            type="button"
            className="workspace-sidebar-item"
            icon={<Mountain />}
            tooltip="Life goals"
            aria-label="Life goals"
            onClick={() => act(onLife)}
          >
            Life goals
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
