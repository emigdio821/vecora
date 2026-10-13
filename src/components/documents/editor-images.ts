import type { Editor, JSONContent } from '@tiptap/react'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'

/** What the picker, paste and drop take; WebP is turned into one of the two the PDF draws. */
export const IMAGE_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Longest side: about 3 times what an A4 page needs, so photos still print sharp. */
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.85

interface PreparedImage {
  src: string
  width: number
  height: number
}

/**
 * Phone photos are 4000px and several MB: this shrinks them to what the PDF needs, as a
 * data URL the document carries. Throws when the browser can't open the file.
 */
async function prepareImage(file: File): Promise<PreparedImage> {
  // Turned upright first, following the photo's orientation.
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('No 2D canvas')
  }
  // The page is white anyway, and JPEG has no transparency.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const jpeg = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  if (file.type !== 'image/png') {
    return { src: jpeg, width, height }
  }
  // Screenshots and drawings are smaller (and sharper) as PNG; a photo saved as PNG isn't.
  const png = canvas.toDataURL('image/png')
  return { src: png.length < jpeg.length ? png : jpeg, width, height }
}

/**
 * Adds the pictures where the cursor is, or where they were dropped. One that can't be
 * opened is skipped with a message; the others still go in.
 */
export async function insertImages(editor: Editor, files: File[], position?: number) {
  const images: JSONContent[] = []
  for (const file of files) {
    try {
      const image = await prepareImage(file)
      images.push({ type: 'image', attrs: image })
    } catch {
      toastManager.add({ type: 'error', title: m.documents_image_failed() })
    }
  }
  if (images.length === 0) {
    return
  }

  if (position === undefined) {
    editor.chain().focus().insertContent(images).run()
  } else {
    editor.chain().focus().insertContentAt(position, images).run()
  }
}

/**
 * Copying an image from a web page also brings its HTML, an <img> pointing to that site,
 * which the editor drops. Without any text in it, the copied file is what was meant.
 */
export function isOnlyImageHtml(html: string | undefined): boolean {
  if (!html) {
    return true
  }
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.trim() === ''
}
