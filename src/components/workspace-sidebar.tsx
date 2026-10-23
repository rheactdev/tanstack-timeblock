import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Columns3,
  Flag,
  Inbox,
  Mountain,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PlannerSearch, PlannerView, WorkspaceData } from "../lib/model";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button, buttonVariants } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  sidebarItemVariants,
  useSidebar,
} from "./ui/sidebar";

type WorkspaceDialog = "account";
const planningViews = [
  { view: "horizons", to: "/horizons", label: "Horizons", icon: Columns3 },
  { view: "inbox", to: "/inbox", label: "Inbox", icon: Inbox },
  { view: "days", to: "/days", label: "Days", icon: CalendarDays },
  { view: "weeks", to: "/weeks", label: "Weeks", icon: CalendarRange },
  { view: "months", to: "/months", label: "Months", icon: Calendar },
  { view: "years", to: "/years", label: "Years", icon: Flag },
] as const;

export function WorkspaceSidebar({
  user,
  view,
  search,
  onLife,
  onDialog,
}: {
  user: WorkspaceData["user"];
  view: PlannerView;
  search: PlannerSearch;
  onLife: () => void;
  onDialog: (dialog: WorkspaceDialog) => void;
}) {
  const { state, isMobile, openMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile || state === "expanded";
  const toggleLabel = isMobile ? "Close workspace navigation" : expanded ? "Collapse workspace navigation" : "Expand workspace navigation";
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
          className="workspace-collapse-button"
          aria-label={toggleLabel}
          aria-expanded={isMobile ? openMobile : expanded}
          title={toggleLabel}
          onClick={toggleSidebar}
        >
          <span className="workspace-collapse-icon-column" aria-hidden="true">
            <span className={buttonVariants({ variant: "secondary", size: "icon", className: "workspace-collapse-icon" })}>
              {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            </span>
          </span>
          {expanded && <span className="workspace-collapse-label">Collapse</span>}
        </Button>
      </SidebarHeader>
      <SidebarContent className="min-h-0 space-y-6 overflow-x-hidden p-2">
        <SidebarGroup>
          {planningViews.map(({ view: target, to, label, icon: Icon }) => (
            <Link
              key={target}
              to={to}
              search={{ ...search, goal: undefined, board: "all" }}
              preload="intent"
              activeOptions={{ exact: true, includeSearch: false }}
              aria-label={label}
              title={expanded ? undefined : label}
              className={`${sidebarItemVariants({ variant: view === target ? "active" : "default" })} workspace-sidebar-item ${view === target ? "text-accent-foreground" : "text-foreground"}`}
              aria-current={view === target ? "page" : undefined}
              onClick={() => { if (isMobile) setOpenMobile(false); }}
            >
              <span className="pointer-events-none shrink-0" aria-hidden="true"><Icon /></span>
              <span className={expanded ? "truncate" : "sr-only"}>{label}</span>
            </Link>
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
      <SidebarFooter className="h-[59px] shrink-0 px-2 py-0">
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
      </SidebarFooter>
    </Sidebar>
  );
}
