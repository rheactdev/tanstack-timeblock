import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, Upload } from 'lucide-react'
import { uploadProfilePicture } from '../lib/functions'
import type { WorkspaceData } from '../lib/model'
import { PROFILE_PICTURE_TYPES, profilePictureError } from '../lib/profile-picture'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { toast } from './ui/toast'

export function ProfilePictureEditor({ user, disabled, onBusyChange, onChanged }: {
  user: NonNullable<WorkspaceData['user']>
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onChanged: () => Promise<void>
}) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState(user.image || undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
  useEffect(() => { setImage(user.image || undefined) }, [user.image])

  async function upload(file: File) {
    if (busy || disabled) return
    const validationError = profilePictureError(file)
    if (validationError) { setError(validationError); return }
    setError('')
    setBusy(true)
    onBusyChange(true)
    try {
      const data = new FormData()
      data.set('image', file)
      const result = await uploadProfilePicture({ data })
      setImage(result.image)
      await onChanged()
      toast.success('Profile picture updated')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The picture could not be uploaded. Please try again.')
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }

  return <div className="profile-picture-editor">
    <div className="account-profile" aria-busy={busy}>
      <Avatar className="h-20 w-20 shadow-none transition-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none">
        {image && <AvatarImage src={image} alt="Your profile picture" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="account-profile-controls">
        <Label htmlFor={inputId}>Profile picture</Label>
        <input ref={input} id={inputId} type="file" accept={PROFILE_PICTURE_TYPES.join(',')} className="sr-only" tabIndex={-1} disabled={busy || disabled} onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void upload(file)
        }} />
        <Button type="button" variant="outline" disabled={busy || disabled} onClick={() => input.current?.click()}>
          {busy ? <LoaderCircle className="spin" aria-hidden /> : <Upload aria-hidden />}
          {busy ? 'Uploading…' : image ? 'Change photo' : 'Upload photo'}
        </Button>
        <p className="dialog-footnote">JPEG, PNG or WebP, up to 5 MB. Cropped to a square.</p>
      </div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
}
