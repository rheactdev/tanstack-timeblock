import { useId, useRef, useState } from "react";
import { Copy, CopyIcon, Icon, Trash2, TrashIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { DialogFooter } from "./ui/dialog";
import { Modal } from "./planner-controls";
import type { Task } from "../lib/model";
import { toast } from "./ui/toast";
import type { Mutate } from "./use-workspace";
import { Label } from "./ui/label";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { ButtonGroup } from "./ui/button-group";

type EditorAction = "closing" | "deleting" | "duplicating";

export function GoalEditor({
  task,
  mutate,
  onClose,
  onDelete,
}: {
  task: Task;
  mutate: Mutate;
  onClose: () => void;
  onDelete: (task: Task) => Promise<boolean>;
}) {
  const titleId = useId();
  const notesId = useId();
  const completedId = useId();
  const titleErrorId = useId();
  const titleInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({
    title: task.title,
    notes: task.notes,
    completed: task.completed,
  });
  const confirmed = useRef(draft);
  const pendingSave = useRef<Promise<boolean> | null>(null);
  const [action, setAction] = useState<EditorAction | null>(null);
  const busy = action !== null;
  const titleIsEmpty = !draft.title.trim();

  async function save(): Promise<boolean> {
    const snapshot = draft;
    // Blur and clicking Close can request the same save; await the first one.
    while (pendingSave.current) {
      if (!(await pendingSave.current)) return false;
    }
    const next = {
      ...snapshot,
      title: snapshot.title.trim() || confirmed.current.title,
    };
    if (
      next.title === confirmed.current.title &&
      next.notes === confirmed.current.notes &&
      next.completed === confirmed.current.completed
    )
      return true;
    const request = mutate({ action: "update", id: task.id, patch: next }).then(
      (result) => {
        if (result) {
          confirmed.current = next;
          return true;
        }
        setDraft((current) => ({
          title:
            current.title === snapshot.title
              ? confirmed.current.title
              : current.title,
          notes:
            current.notes === snapshot.notes
              ? confirmed.current.notes
              : current.notes,
          completed:
            current.completed === snapshot.completed
              ? confirmed.current.completed
              : current.completed,
        }));
        return false;
      },
    );
    pendingSave.current = request;
    try {
      return await request;
    } finally {
      pendingSave.current = null;
    }
  }

  async function handleAction(next: EditorAction) {
    if (busy) return;
    if (next !== "deleting" && titleIsEmpty) {
      titleInput.current?.focus();
      return;
    }
    setAction(next);
    try {
      if (!(await save())) return;
      if (next === "closing") onClose();
      else if (next === "deleting") await onDelete(task);
      else if (await mutate({ action: "duplicate", id: task.id }))
        toast.success("Goal duplicated");
    } finally {
      setAction(null);
    }
  }

  return (
    <Modal
      title="Edit goal"
      hideHeader
      onClose={() => {
        void handleAction("closing");
      }}
      headerContent={
        <Badge>
          {task.horizon.charAt(0).toUpperCase() + task.horizon.slice(1)}
        </Badge>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        aria-busy={busy}
        onBlur={() => {
          void save();
        }}
      >
        <FieldGroup>
          <Field data-invalid={titleIsEmpty || undefined}>
            <FieldLabel htmlFor={titleId}>Title</FieldLabel>
            <Input
              ref={titleInput}
              autoFocus
              type="text"
              id={titleId}
              name="title"
              placeholder="Enter a goal title"
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              aria-invalid={titleIsEmpty || undefined}
              aria-describedby={titleIsEmpty ? titleErrorId : undefined}
              maxLength={240}
              disabled={busy}
              required
            />
            <FieldError id={titleErrorId}>
              {titleIsEmpty ? "Title is required." : null}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor={notesId}>Notes & thoughts</FieldLabel>
            <Textarea
              id={notesId}
              name="notes"
              placeholder="Add notes..."
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              rows={7}
              maxLength={5000}
              disabled={busy}
            />
          </Field>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={completedId}
              checked={draft.completed}
              onCheckedChange={(value) =>
                setDraft({ ...draft, completed: value === true })
              }
              disabled={busy}
            />
            <Label htmlFor={completedId}>Completed</Label>
          </div>
        </FieldGroup>
      </form>
      <DialogFooter aria-busy={busy}>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => {
            void handleAction("deleting");
          }}
        >
          <Trash2 aria-hidden="true" />
          {action === "deleting" ? "Deleting…" : "Delete"}
        </Button>
        <ButtonGroup>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || titleIsEmpty}
            onClick={() => {
              void handleAction("duplicating");
            }}
          >
            <CopyIcon />
            {action === "duplicating" ? "Duplicating…" : "Duplicate"}
          </Button>
        </ButtonGroup>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            void handleAction("closing");
          }}
        >
          {action === "closing" ? "Saving…" : "Close"}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
