import Image from '@tiptap/extension-image'
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  IMAGE_MAX_SIZE,
  IMAGE_MIN_SIZE,
  type ImageAlign,
  imageAlign,
  imageSize,
  TEXT_ALIGNS,
  type TextAlign,
} from '@/lib/validations/documents'

type Side = 'left' | 'right'

const JUSTIFY: Record<ImageAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

/** The sides that move: a centered image grows both ways, a left one only to the right. */
const HANDLES: Record<ImageAlign, Side[]> = {
  left: ['right'],
  center: ['left', 'right'],
  right: ['left'],
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function savedAlign(value: unknown): TextAlign | null {
  return TEXT_ALIGNS.find((align) => align === value) ?? null
}

interface Resize {
  side: Side
  /** 2 for a centered image, which grows on both sides at once. */
  growth: number
  startX: number
  startWidth: number
  /** The space the image sits in: the page, or a list item or quote. */
  availableWidth: number
}

function clampSize(size: number): number {
  return Math.min(IMAGE_MAX_SIZE, Math.max(IMAGE_MIN_SIZE, Math.round(size)))
}

/** A number HTML attribute, like a copied image's width="1600"; null when it isn't one. */
function numberAttribute(element: HTMLElement, name: string): number | null {
  const value = Number.parseFloat(element.getAttribute(name) ?? '')
  if (Number.isFinite(value) && value > 0) {
    return value
  }
  return null
}

/**
 * The image, aligned with the toolbar like the text, with resize handles once it's
 * selected. Its size is a percentage of the space it sits in: the same share of the page
 * in the PDF, whatever the screen it was set on. Until it's resized, the share its own
 * size takes of the page (see imageSize).
 */
function ImageView({ node, selected, editor, updateAttributes }: NodeViewProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<Resize | null>(null)
  // Only while dragging: the document changes once, when the handle is let go.
  const [resizingSize, setResizingSize] = useState<number | null>(null)

  const align = imageAlign(savedAlign(node.attrs.textAlign))

  let size = imageSize({
    size: numberValue(node.attrs.size),
    width: numberValue(node.attrs.width),
    height: numberValue(node.attrs.height),
  })
  if (resizingSize !== null) {
    size = resizingSize
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>, side: Side) {
    const frame = frameRef.current
    const available = frame?.parentElement
    if (!frame || !available) {
      return
    }
    // Neither a click in the text nor the start of dragging the image somewhere else.
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeRef.current = {
      side,
      growth: align === 'center' ? 2 : 1,
      startX: event.clientX,
      startWidth: frame.offsetWidth,
      availableWidth: available.clientWidth,
    }
  }

  function moveResize(event: React.PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current
    if (!resize) {
      return
    }
    let moved = event.clientX - resize.startX
    if (resize.side === 'left') {
      moved = -moved
    }
    const width = resize.startWidth + moved * resize.growth
    setResizingSize(clampSize((width / resize.availableWidth) * 100))
  }

  function endResize() {
    if (!resizeRef.current) {
      return
    }
    resizeRef.current = null
    if (resizingSize !== null) {
      updateAttributes({ size: resizingSize })
    }
    setResizingSize(null)
  }

  const src: unknown = node.attrs.src
  const alt: unknown = node.attrs.alt

  return (
    // Spaced by typeset-document like the PDF; typeset's own image styles stay out.
    <NodeViewWrapper data-not-typeset className={cn('flex', JUSTIFY[align])}>
      <div
        ref={frameRef}
        className="relative max-w-full"
        style={size === null ? undefined : { width: `${size}%` }}
      >
        <img
          src={typeof src === 'string' ? src : undefined}
          alt={typeof alt === 'string' ? alt : ''}
          data-drag-handle
          className={cn(
            'block h-auto rounded-sm',
            // Pasted without its pixels: as wide as it fits, about as tall as the PDF allows.
            size === null ? 'max-h-88 w-auto max-w-full' : 'w-full',
            selected && 'outline-2 outline-offset-2 outline-ring',
          )}
        />
        {selected &&
          editor.isEditable &&
          HANDLES[align].map((side) => (
            <div
              key={side}
              aria-hidden
              className={cn(
                'absolute top-1/2 h-10 w-2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-background bg-ring shadow-sm',
                side === 'left' ? '-left-1' : '-right-1',
              )}
              onPointerDown={(event) => {
                startResize(event, side)
              }}
              onPointerMove={(event) => {
                moveResize(event)
              }}
              onPointerUp={() => {
                endResize()
              }}
              onPointerCancel={() => {
                endResize()
              }}
            />
          ))}
        {resizingSize !== null && (
          <span className="absolute top-2 right-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-xs text-background tabular-nums">
            {resizingSize}%
          </span>
        )}
      </div>
    </NodeViewWrapper>
  )
}

/**
 * Only images the document already carries (copied from this editor). One pasted from a
 * web page points to that site, and the PDF never fetches addresses: it's left out.
 */
export const DocumentImage = Image.extend({
  parseHTML() {
    return [{ tag: 'img[src^="data:image/png;base64,"]' }, { tag: 'img[src^="data:image/jpeg;base64,"]' }]
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      // The picture's own pixels, numbers again when an image is copied and pasted.
      width: {
        default: null,
        parseHTML: (element) => numberAttribute(element, 'width'),
      },
      height: {
        default: null,
        parseHTML: (element) => numberAttribute(element, 'height'),
      },
      /** Percentage of the available width; null until it's resized (see imageSize). */
      size: {
        default: null,
        parseHTML: (element) => {
          const size = numberAttribute(element, 'data-size')
          return size === null ? null : clampSize(size)
        },
        renderHTML: (attributes) => {
          if (typeof attributes.size !== 'number') {
            return {}
          }
          return { 'data-size': attributes.size }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
}).configure({ allowBase64: true })
