import { useId, useRef, useState } from 'react'
import { Image, Settings2, Trash2, UserRound } from 'lucide-react'
import type { WorkspaceData } from '../lib/model'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { SidebarItem } from './ui/sidebar'

export function WorkspacePopover({ user, onAccount, onSettings, onAppearance, onDeleted }: {
  user: WorkspaceData['user']
  onAccount: () => void
  onSettings: () => void
  onAppearance: () => void
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const openingDialog = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  function openDialog(action: () => void) {
    openingDialog.current = true
    setOpen(false)
    action()
  }

  return <Popover open={open} onOpenChange={value => { openingDialog.current = false; setOpen(value) }}>
    <PopoverTrigger asChild>
      <SidebarItem type="button" tooltip="Workspace and account" aria-label="Workspace and account" icon={<span className="workspace-avatar">{user?.name.charAt(0).toUpperCase() || 'F'}</span>}>{user?.name || 'Guest workspace'}</SidebarItem>
    </PopoverTrigger>
    <PopoverContent side="right" align="start" sideOffset={12} collisionPadding={12} aria-labelledby={titleId} aria-describedby={descriptionId} className="workspace-popover" onCloseAutoFocus={event => {
      // Let the newly opened dialog receive focus instead of returning it to the rail.
      if (openingDialog.current) { event.preventDefault(); openingDialog.current = false }
    }}>
      <div className="workspace-popover-heading">
        <h2 id={titleId}>{user?.name || 'Guest workspace'}</h2>
        <p id={descriptionId}>{user?.email || 'Your personal planning space.'}</p>
      </div>
      <Button type="button" variant="outline" onClick={() => openDialog(onAccount)}><UserRound />{user ? 'Your account' : 'Sign in / create account'}</Button>
      <div className="workspace-popover-actions">
        <Button type="button" variant="ghost" onClick={() => openDialog(onSettings)}><Settings2 />Settings</Button>
        <Button type="button" variant="ghost" onClick={() => openDialog(onAppearance)}><Image />Background</Button>
        <Button type="button" variant="ghost" onClick={() => openDialog(onDeleted)}><Trash2 />Deleted goals</Button>
      </div>
    </PopoverContent>
  </Popover>
}
