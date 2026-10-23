import { Suspense } from "react";
import { Await } from "@tanstack/react-router";
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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
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
  progress,
  completed,
  total,
  onNavigate,
  onLife,
  onDialog,
}: {
  user: WorkspaceData["user"];
  view: PlannerView;
  progress: Promise<{ completed: number; total: number }>;
  completed: number;
  total: number;
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
      className="min-h-0"
      role="navigation"
      aria-label="Workspace tools"
    >
      <SidebarHeader className="h-[59px] shrink-0 px-4 py-0 group-data-[state=collapsed]/sidebar:px-2">
        <span className="min-w-0 truncate font-bold" aria-label="Horizons">
          {expanded ? "Horizons" : "H"}
        </span>
      </SidebarHeader>
      <SidebarContent className="min-h-0 space-y-6 group-data-[state=collapsed]/sidebar:p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Plan</SidebarGroupLabel>
          {planningViews.map(({ view: target, label, icon: Icon }) => (
            <SidebarItem
              key={target}
              type="button"
              icon={<Icon />}
              tooltip={label}
              aria-label={label}
              variant={view === target ? "active" : "default"}
              className={view === target ? "text-accent-foreground" : undefined}
              aria-current={view === target ? "page" : undefined}
              onClick={() => act(() => onNavigate(target))}
            >
              {label}
            </SidebarItem>
          ))}
          <SidebarItem
            type="button"
            icon={<Mountain />}
            tooltip="Life goals"
            aria-label="Life goals"
            onClick={() => act(onLife)}
          >
            Life goals
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="shrink-0 flex-col items-stretch group-data-[state=collapsed]/sidebar:p-2">
        <Suspense
          fallback={
            <span className={expanded ? "workspace-stats" : "sr-only"}>
              Loading progress...
            </span>
          }
        >
          <Await promise={progress}>
            {() => (
              <span className={expanded ? "workspace-stats" : "sr-only"}>
                {completed} completed · {total} goals
              </span>
            )}
          </Await>
        </Suspense>
        <Button
          type="button"
          variant="ghost"
          className="workspace-account-button"
          data-collapsed={!expanded}
          aria-label={user ? "Your account" : "Sign in"}
          aria-haspopup="dialog"
          title={accountName}
          onClick={() => showDialog("account")}
        >
          <Avatar className="shadow-none transition-colors hover:translate-x-0 hover:translate-y-0 hover:shadow-none" aria-hidden="true">
            {user?.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="text-sm">
              {initials || <UserRound aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
          {expanded && <span className="workspace-account-label">{accountName}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
