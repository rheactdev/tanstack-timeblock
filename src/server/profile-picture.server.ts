import '@tanstack/react-start/server-only'
import { createHash, randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getRequestHeaders } from '@tanstack/react-start/server'
import sharp from 'sharp'
import { profilePictureError } from '../lib/profile-picture'
import { getAuth } from './auth.server'

function pictureStorage() {
  const { S3_KEYID, S3_SECRET, S3_ENDPOINT, S3_REGION, S3_BUCKET } = process.env
  if (!S3_KEYID || !S3_SECRET || !S3_ENDPOINT || !S3_REGION || !S3_BUCKET) {
    throw new Error('Profile picture uploads need S3_KEYID, S3_SECRET, S3_ENDPOINT, S3_REGION, and S3_BUCKET on the server.')
  }
  let endpoint: URL
  try {
    endpoint = new URL(S3_ENDPOINT.includes('://') ? S3_ENDPOINT : `https://${S3_ENDPOINT}`)
  } catch {
    throw new Error('S3_ENDPOINT must be your B2 S3 endpoint hostname or HTTPS URL.')
  }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') {
    throw new Error('S3_ENDPOINT must be an HTTPS S3 endpoint without a bucket path, credentials, or query parameters.')
  }
  return {
    bucket: S3_BUCKET,
    endpoint,
    client: new S3Client({
      endpoint: endpoint.href,
      region: S3_REGION,
      credentials: { accessKeyId: S3_KEYID, secretAccessKey: S3_SECRET },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      maxAttempts: 2,
    }),
  }
}

function supportedImage(bytes: Buffer) {
  return (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    || (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
}

export async function saveProfilePicture(data: FormData) {
  const auth = getAuth()
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Sign in to upload a profile picture.')

  const file = data.get('image')
  if (!(file instanceof File)) throw new Error('Choose a profile picture to upload.')
  const validationError = profilePictureError(file)
  if (validationError) throw new Error(validationError)
  const storage = pictureStorage()
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!supportedImage(bytes)) throw new Error('Choose a valid JPEG, PNG, or WebP image.')

  let picture: Buffer
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'error', animated: false })
    const metadata = await image.metadata()
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error('Unsupported image format.')
    picture = await image.rotate().resize(512, 512, { fit: 'cover' }).webp({ quality: 85 }).timeout({ seconds: 10 }).toBuffer()
  } catch {
    throw new Error('That image could not be processed. Choose a valid JPEG, PNG, or WebP image with smaller dimensions.')
  }

  // Resolve ownership from the session; never accept a user ID or object key from the browser.
  const owner = createHash('sha256').update(session.user.id).digest('hex')
  const key = `avatars/${owner}/${randomUUID()}.webp`
  const url = new URL(storage.endpoint)
  url.pathname = `/${encodeURIComponent(storage.bucket)}/${key}`
  try {
    await storage.client.send(new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      Body: picture,
      ContentType: 'image/webp',
      ContentLength: picture.length,
      CacheControl: 'public, max-age=31536000, immutable',
      ContentDisposition: 'inline',
    }), { abortSignal: AbortSignal.timeout(30_000) })
  } catch {
    throw new Error('The profile picture could not be uploaded. Check the B2 configuration and try again.')
  } finally {
    storage.client.destroy()
  }

  try {
    await auth.api.updateUser({ headers, body: { image: url.href } })
  } catch {
    throw new Error('The picture uploaded, but your profile could not be updated. Please try again.')
  }
  return { image: url.href }
}
