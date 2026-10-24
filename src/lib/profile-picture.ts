export const PROFILE_PICTURE_MAX_BYTES = 5 * 1024 * 1024
export const PROFILE_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function profilePictureError(file: Pick<File, 'type' | 'size'>): string | undefined {
  if (!PROFILE_PICTURE_TYPES.some(type => type === file.type)) return 'Choose a JPEG, PNG, or WebP image.'
  if (file.size === 0) return 'Choose an image that is not empty.'
  if (file.size > PROFILE_PICTURE_MAX_BYTES) return 'Choose an image smaller than 5 MB.'
}
