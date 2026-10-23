import { Suspense } from "react";
import { Await } from "@tanstack/react-router";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  Columns3,
  Flag,
  Inbox,
  LoaderCircle,
  Mountain,
  UserRound,
} from "lucide-react";
import type { PlannerView, WorkspaceData } from "../lib/model";
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
  saving,
  progress,
  completed,
  total,
  onNavigate,
  onLife,
  onDialog,
}: {
  user: WorkspaceData["user"];
  view: PlannerView;
  saving: boolean;
  progress: Promise<{ completed: number; total: number }>;
  completed: number;
  total: number;
  onNavigate: (view: PlannerView) => void;
  onLife: () => void;
  onDialog: (dialog: WorkspaceDialog) => void;
}) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const expanded = isMobile || state === "expanded";

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
      <SidebarHeader className="shrink-0">
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
        <SidebarItem
          type="button"
          icon={<UserRound />}
          tooltip="Your account"
          aria-label="Your account"
          onClick={() => showDialog("account")}
        >
          {user?.name || "Sign in"}
        </SidebarItem>
        <div
          className={`workspace-sync ${expanded ? "" : "workspace-sync-collapsed"}`}
          role="status"
          aria-label={saving ? "Saving changes" : "All changes saved"}
        >
          {saving ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <Check size={14} />
          )}
          {expanded && (
            <span>{saving ? "Saving..." : "All changes saved"}</span>
          )}
        </div>
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
      </SidebarFooter>
    </Sidebar>
  );
}
