export type ProjectMediaItem = {
  type?: 'image' | 'video'
  src: string
  poster?: string
  alt?: string
}

export type NormalizedProjectMediaItem = {
  type: 'image' | 'video'
  src: string
  poster?: string
  alt: string
}

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov'])

export function isVideoSrc(src?: string) {
  if (!src) {
    return false
  }

  const cleanSrc = src.split('?')[0]?.split('#')[0]
  if (!cleanSrc) {
    return false
  }

  const lastDot = cleanSrc.lastIndexOf('.')
  if (lastDot === -1) {
    return false
  }

  const ext = cleanSrc.slice(lastDot + 1).toLowerCase()
  return VIDEO_EXTENSIONS.has(ext)
}

export function normalizeProjectMediaItem(
  item: string | ProjectMediaItem,
  fallbackAlt: string,
): NormalizedProjectMediaItem {
  if (typeof item === 'string') {
    return {
      type: isVideoSrc(item) ? 'video' : 'image',
      src: item,
      alt: fallbackAlt,
    }
  }

  const resolvedType = item.type ?? (isVideoSrc(item.src) ? 'video' : 'image')

  return {
    type: resolvedType,
    src: item.src,
    poster: item.poster,
    alt: item.alt ?? fallbackAlt,
  }
}
