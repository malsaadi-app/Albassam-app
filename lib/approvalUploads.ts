import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export type SavedUpload = {
  urlPath: string
  originalName: string
  size: number
  mimeType: string
}

const MAX_APPROVAL_DOC_SIZE = 10 * 1024 * 1024 // 10MB

export function isAllowedApprovalMime(mime: string) {
  return mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png'
}

export async function saveApprovalDocument(file: File): Promise<SavedUpload> {
  if (!file) {
    throw new Error('NO_FILE')
  }

  if (file.size > MAX_APPROVAL_DOC_SIZE) {
    throw new Error('FILE_TOO_LARGE')
  }

  // Some browsers may send empty type; infer from extension in that case.
  const mimeType = file.type || 'application/octet-stream'

  if (file.type && !isAllowedApprovalMime(file.type)) {
    throw new Error('INVALID_FILE_TYPE')
  }

  const approvalsDir = path.join(process.cwd(), 'public', 'uploads', 'approvals')
  if (!existsSync(approvalsDir)) {
    await mkdir(approvalsDir, { recursive: true })
  }

  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2)
  const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '')
  const safeExt = ext.slice(0, 10)

  const filename = `${timestamp}-${random}${safeExt}`
  const filepath = path.join(approvalsDir, filename)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)

  return {
    urlPath: `/uploads/approvals/${filename}`,
    originalName: file.name,
    size: file.size,
    mimeType,
  }
}
