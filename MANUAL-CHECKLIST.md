# Core Horizons — manual verification

Verification is left to you. No tests, builds, type checks, or application browser checks were run during this rebuild.

## Start

- [ ] Use the existing `.env` credentials. To use your local CouchDB, set `COUCHDB_URL=http://127.0.0.1:5984`, start your database, and run `npm run db:init` if the application database has not been created.
- [ ] Run `npm run dev`. Visit `/horizons`.
- [ ] Optionally run `npm run typecheck` and `npm run build` yourself.

## Layout and BoldKit

- [ ] Confirm there is one BoldKit sidebar, tall plain goal columns, collapsed rails at the right, and a narrow scenic strip. There should be no secondary sidebar or board controls.
- [ ] Period views have a single toolbar containing the sidebar toggle, Horizons navigation, current view name, date picker, Today action, and filters. The view name and Today action should each appear once.
- [ ] Confirm the toolbar has a five-color top strip, a solid 3px bottom border, a 56px control row, and square outlined controls. Search opens the search dialog; compact controls remain accessible at narrow widths without moving on hover.
- [ ] The five-color strip spans the entire app above the sidebar, planner, and scenic strip. The sidebar and planner header borders should align beneath it.
- [ ] The sidebar shows Horizons (H when collapsed) in its header and a clickable BoldKit avatar at the bottom in both expanded and collapsed modes. The avatar opens the account dialog and shows the account image or initials, with a guest icon before sign-in. Its border keeps BoldKit’s default foreground color during successful, pending, and failed saves. The avatar has no drop shadow, stays centered in the collapsed footer, and stays still on hover. The header borders should remain aligned.
- [ ] The sidebar footer has no sync check, spinner, or sync status text. Save failures still show an error notification and restore the last confirmed workspace state.
- [ ] Expand and collapse the sidebar, including with ⌘B/Ctrl+B. Check Inbox, Horizons, Days, Weeks, Months, Years, and Life navigation. On mobile, open the sidebar drawer and select a destination.
- [ ] Collapse the sidebar and navigate between planning views. It should remain collapsed. Expand it and navigate again; it should remain expanded.
- [ ] Switch between Horizons, Days, Weeks, Months, and Years with a selected date. The toolbar date picker should stay mounted without flashing or resetting its date. Today should appear only when the selected date differs from today.
- [ ] Hover each sidebar item, including along its edges. Only its background should change; labels should not flicker or intercept the pointer. The sidebar starts expanded, and Account opens its dialog directly without a popover.
- [ ] In collapsed mode, hover an item long enough to see its native browser label. Sidebar items should not open animated tooltip portals. Toggle the sidebar from the main content toolbar; its button should stay under the pointer on hover.
- [ ] Confirm dark BoldKit surfaces, Outfit typography, square bordered controls, hard shadows, and coral/teal/yellow accents. There should be no dashboard hero, motivational quote panel, numbered columns, or invented category badges.
- [ ] On a new workspace, Inbox, Year, and Life start expanded. Expand Day, collapse another column with its header icon, reload, and confirm the arrangement is retained.
- [ ] Hover or keyboard-focus a column heading. Only Add and Collapse should appear next to the title; Add focuses the inline goal input. Touch devices keep these controls visible. Column bottoms should have no date navigation bars.
- [ ] Check horizontal scrolling and mobile navigation at narrow widths. Use Tab, Shift+Tab, Enter, and Esc through dialogs, menus, date pickers, and search.

## Dates and period boundaries

- [ ] Create goals on two adjacent dates; each should appear only in its own Day column. A day goal must not also appear as a weekly/monthly/yearly goal.
- [ ] Confirm Days shows seven Monday–Sunday dates, Weeks six consecutive Monday-start weeks, Months twelve months, and Years ten years.
- [ ] Choose a month or year using the date picker. Related horizon columns should follow the shared calendar cursor.
- [ ] In Days, Weeks, Months, and Years, use the left and right buttons beside the date picker. Each click should move the cursor by one day, week, month, or year respectively while retaining filters and sidebar state. Today returns to the current date; on mobile it is available inside the date picker.
- [ ] Choose a date near New Year, a month end, leap day, and a daylight-saving transition. Confirm labels, week starts, and rescheduling remain date-correct. Today returns to the current New York date.
- [ ] Leave an incomplete goal on an earlier date; it should remain there rather than move automatically.
- [ ] Open a dated URL directly, reload it, and confirm the selected calendar period and filters are retained. Open a legacy `/?view=day` URL and confirm it redirects to Days.

## Goals, movement, and persistence

- [ ] Add a goal with Add… and Enter. Escape should cancel an inline entry. Complete and reopen it.
- [ ] Alt/Option-click a goal to rename it. Enter saves and Escape cancels.
- [ ] Edit title, notes, color, completion, and schedule together; reload and confirm all changes. No board selector should appear.
- [ ] Reschedule using Today, Tomorrow, This Week, Next Week, a specific week/month/year, Life, and Inbox.
- [ ] Drag a goal between lists and before another goal. Drop at the end of a list. Reload after each operation to confirm its destination and position.
- [ ] Use Move to position with a keyboard or touch device. Confirm it works without dragging.
- [ ] Duplicate a goal. Its title, notes, color, board, and schedule should be copied, with the copy incomplete and a new ID.

## Filters, deletion, and failures

- [ ] Use F and ⌘K/Ctrl+K outside text fields. Typing F inside a goal title or notes must not open search.
- [ ] Search complete words in goal titles and notes, including a goal in a different period. Open the result and reload its selected-goal URL.
- [ ] Exercise color/completion filters and Clear filters. Confirm the Filters dialog has no board selector.
- [ ] Open an old `/boards/example` URL or a URL with `?board=example`. The board route should redirect to Horizons, and the old filter should not hide goals.
- [ ] Delete a goal, use Undo, and confirm restoration. Delete it again and restore it from Settings → Deleted goals. Confirm the original content and schedule remain.
- [ ] Make the database temporarily unavailable and attempt an edit. The save error should appear and the last confirmed workspace state should return. Reconnect and save again.
- [ ] Rapidly complete or move multiple goals; confirm the final saved result matches the operations after reload.

## Migration and isolation

- [ ] If you have a v1 workspace, confirm that its first load retains every goal’s ID, notes, color, board, completion, and order, with dates assigned to the migration’s current periods. Reload again; those dates must not be reassigned.
- [ ] In CouchDB/Fauxton, the migrated workspace document should have `schemaVersion: 2` inside `workspace`, plus `legacyWorkspace` and migration metadata.
- [ ] Sign into two different accounts and compare their workspaces. Goals and preferences must remain isolated. The guest workspace should stay separate from both accounts.
- [ ] Export JSON and confirm it includes tasks, boards, schema version, deleted goals, and workspace preferences, with no credentials or authentication session data.
