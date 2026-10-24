# Core Horizons — manual verification

Verification is left to you. No tests, builds, type checks, or application browser checks were run during this rebuild.

## Start

- [ ] Use the existing `.env` credentials. To use your local CouchDB, set `COUCHDB_URL=http://127.0.0.1:5984`, start your database, and run `npm run db:init` if the application database has not been created.
- [ ] Run `npm run dev`. Visit `/horizons`.
- [ ] Optionally run `npm run typecheck` and `npm run build` yourself.

## Coolify deployment

- [ ] Use the Git-based Docker Compose build strategy with `compose.coolify.yaml`. Set `BETTER_AUTH_SECRET` and `COUCHDB_PASSWORD` in Coolify. Confirm the secret is at least 32 characters. With no literal `BETTER_AUTH_URL` override, confirm it resolves from `SERVICE_URL_APP_3000` to the app's public HTTPS origin, without the internal port or `/api/auth` path.
- [ ] Assign only the app service a domain routed to internal port 3000. Confirm CouchDB has no public domain or published host port. Neither service should need repository bind mounts.
- [ ] Deploy and confirm CouchDB becomes healthy before the app starts. App logs should report database/index initialization before Nitro starts listening on port 3000. Both services should become healthy.
- [ ] Request `/api/health` yourself and confirm an OK response. Repeated health requests should not create visitor workspace documents or auth cookies.
- [ ] Sign up, sign in, sign out, create goals, and reload using the public HTTPS domain. Confirm auth works behind Coolify’s proxy and account isolation is retained.
- [ ] Redeploy and restart the services. Goals and accounts should persist, the initializer should accept the existing database/index, and the signing secret and credentials should remain unchanged.
- [ ] Confirm the existing local `compose.yaml` and `.env` still work independently. Existing local data should remain untouched; copy it to Coolify separately if required.

## Layout and BoldKit

- [ ] The Horizons view label uses 18px text. Column headings such as Inbox, Week, Year, and Life remain 22px, sharing its weight, line height, and letter spacing across screen widths and dedicated period views. On desktop Horizons, the view label and first column title share the same left edge; goal rows retain their alignment with the column titles.
- [ ] Column headers use 8px top and bottom padding and a 56px minimum height. With no active filters, titles align with the first sidebar navigation row on desktop; spacing stays consistent across sidebar states and screen widths.
- [ ] Confirm there is one BoldKit sidebar, tall plain goal columns, collapsed rails at the right, and a narrow strip showing only the grid background, with no buttons or date picker. There should be no secondary sidebar or board controls.
- [ ] Period views have a single toolbar containing the current view name, date picker, Today action, filters, and Settings, with no back arrow or Back to Horizons link. Settings sits immediately after Filters with matching size and styling, opens the settings dialog, and no longer appears in the scenic strip. A sidebar opener appears in the toolbar on mobile. The view name and Today action should each appear once.
- [ ] The sidebar toggle is in the top header, above a horizontal divider. Its icon uses BoldKit’s secondary colors and measures 40 × 40px, matching the avatar, with no drop shadow or movement on hover. When expanded, it shows Collapse with the same text styling and alignment as the avatar’s account label. When collapsed, its icon still opens the sidebar.
- [ ] Confirm the toolbar has a five-color top strip, a solid 3px bottom border, a 56px control row, and square outlined controls. Search opens the search dialog; compact controls remain accessible at narrow widths without moving on hover.
- [ ] The five-color strip spans the entire app above the sidebar, planner, and scenic strip. The divider below the sidebar toggle aligns with the planner toolbar divider, and a second divider separates the bottom account footer. Header and footer remain 59px tall. Navigation has no Plan subheader, and the sidebar has no goal summary.
- [ ] The sidebar footer shows a clickable BoldKit avatar in both expanded and collapsed modes. The avatar opens the account dialog and shows the account image or initials, with a guest icon before sign-in. Its border keeps BoldKit’s default foreground color during successful, pending, and failed saves. The avatar has no drop shadow, stays centered in the collapsed footer, and stays still on hover.
- [ ] The sidebar has no sync check, spinner, or sync status text. Save failures still show an error notification and restore the last confirmed workspace state.
- [ ] Expand and collapse the sidebar, including with ⌘B/Ctrl+B. Check Inbox, Horizons, Days, Weeks, Months, Years, and Life navigation. On mobile, open the sidebar drawer and select a destination.
- [ ] From Inbox and each period view, select Life goals. Horizons should open, expand Life if necessary, and scroll horizontally to its column without snapping back to Inbox. Repeat while already on Horizons, with Life collapsed and expanded, using both sidebar states and mobile. Repeated clicks should still focus Life, its expanded state should persist after reload, and reduced-motion preferences should skip smooth scrolling.
- [ ] Collapse the sidebar and navigate between planning views, reload, and open a planning URL in a new tab. It should start collapsed without expanding first. Repeat with it expanded, including toggling with ⌘B/Ctrl+B. The preference should survive closing and reopening the browser.
- [ ] Open and close the mobile drawer, then return to desktop. The saved desktop sidebar state should be unchanged. If local storage is blocked, the cookie should retain the preference; if both are blocked, sidebar toggling and navigation should still work for the current visit.
- [ ] In collapsed mode, click rapidly between Horizons, Inbox, Days, Weeks, Months, and Years, then use browser Back and Forward. Only the active highlight should change, without color fading, icon replacement, or sidebar width changes. Links retain the selected date and filters, close the selected goal, preload on intent, and support opening in a new tab.
- [ ] Toggle the sidebar repeatedly. Its width should animate, while the avatar, navigation icons, and spacing above the first item stay fixed; labels should be clipped within the sidebar as it opens.
- [ ] Switch between Horizons, Days, Weeks, Months, and Years with a selected date. The toolbar date picker should stay mounted without flashing or resetting its date. Today should appear only when the selected date differs from today.
- [ ] Hover each sidebar item, including along its edges. Only its background should change; labels should not flicker or intercept the pointer. The sidebar starts expanded on a first visit and uses the saved state on later visits. Account opens its dialog directly without a popover.
- [ ] In collapsed mode, hover an item long enough to see its native browser label. Sidebar items should not open animated tooltip portals. Toggle the sidebar from its header; its button should stay under the pointer on hover. On mobile, open the drawer from the toolbar, close it from the header, and open the account dialog from the footer.
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
- [ ] Open a goal editor for Inbox, Day, Week, Month, Year, and Life goals. A BoldKit badge should show the current horizon above the labeled Title input, in the same row as the close button on desktop and mobile. Reschedule a goal from its row menu, reopen the editor, and confirm the badge matches. There should be no visible Goal heading or introductory description. Clicking the title label should focus the input; the title remains required and limited to 240 characters. Confirm the close button and Escape still dismiss the editor.
- [ ] Title and Notes & thoughts should both use official BoldKit labels linked to their input controls. The editor should have no Save or Delete buttons, Schedule field, color field, or board selector. Scheduling, color changes, and deletion remain available in the goal row menu.
- [ ] Edit title and notes, pause for at least half a second, then reload and confirm automatic persistence. Completion changes should save immediately. Leaving a field, pressing Enter in the title, closing with ×/Escape/the overlay, or navigating to another goal should flush pending edits; Enter in notes should insert a newline. Reopen after saves finish and confirm its horizon, date, and color are unchanged.
- [ ] While a save is slow, continue typing and editing the other fields, then close the popup. Reopen after requests finish and confirm the latest edits won. Use an IME to compose text and confirm autosaving waits until composition finishes. Clear the title or enter only spaces: a required-title message should appear, the previous valid title should remain saved, and notes/completion should still autosave.
- [ ] Make the database temporarily unavailable during an autosave. Confirm the error notification appears and failed fields return to their last confirmed values without discarding text typed after that request started. Reconnect, edit again, and confirm automatic saving resumes.
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
