import { isVideoSrc, normalizeProjectMediaItem } from '@/lib/media'
import { describe, expect, it } from 'vitest'

describe('isVideoSrc', () => {
  it('detects each supported video extension', () => {
    for (const src of ['clip.mp4', 'clip.webm', 'clip.ogg', 'clip.mov']) {
      expect(isVideoSrc(src)).toBe(true)
    }
  })

  it('treats non-video extensions as images', () => {
    for (const src of ['photo.jpg', 'photo.png', 'photo.webp', 'photo.avif']) {
      expect(isVideoSrc(src)).toBe(false)
    }
  })

  it('is case-insensitive', () => {
    expect(isVideoSrc('clip.MP4')).toBe(true)
    expect(isVideoSrc('clip.MoV')).toBe(true)
  })

  it('ignores query strings and fragments', () => {
    expect(isVideoSrc('clip.mp4?v=2')).toBe(true)
    expect(isVideoSrc('clip.mp4#t=10')).toBe(true)
    expect(isVideoSrc('clip.mp4#t=10?v=2')).toBe(true)
    expect(isVideoSrc('photo.jpg?v=2')).toBe(false)
  })

  it('returns false for missing, empty or extensionless sources', () => {
    expect(isVideoSrc(undefined)).toBe(false)
    expect(isVideoSrc('')).toBe(false)
    expect(isVideoSrc('no-extension')).toBe(false)
  })

  it('does not mistake a directory dot for an extension', () => {
    expect(isVideoSrc('/assets/v1.2/clip')).toBe(false)
  })
})

describe('normalizeProjectMediaItem', () => {
  it('expands a bare string into an image with the fallback alt', () => {
    expect(normalizeProjectMediaItem('photo.jpg', 'Fallback alt')).toEqual({
      type: 'image',
      src: 'photo.jpg',
      alt: 'Fallback alt',
    })
  })

  it('infers the video type from a bare string source', () => {
    expect(normalizeProjectMediaItem('clip.mp4', 'Fallback alt')).toEqual({
      type: 'video',
      src: 'clip.mp4',
      alt: 'Fallback alt',
    })
  })

  it('infers the type from the source when the object omits it', () => {
    expect(normalizeProjectMediaItem({ src: 'clip.webm' }, 'Fallback alt').type).toBe('video')
    expect(normalizeProjectMediaItem({ src: 'photo.png' }, 'Fallback alt').type).toBe('image')
  })

  it('lets an explicit type override extension inference', () => {
    // Guards the poster-frame case: a still exported as .mp4 must stay an image.
    expect(normalizeProjectMediaItem({ type: 'image', src: 'clip.mp4' }, 'Fallback alt').type).toBe(
      'image',
    )
  })

  it('prefers the item alt over the fallback', () => {
    expect(
      normalizeProjectMediaItem({ src: 'photo.jpg', alt: 'Specific alt' }, 'Fallback').alt,
    ).toBe('Specific alt')
  })

  it('preserves a deliberately empty alt rather than falling back', () => {
    // `??` is load-bearing here: `||` would replace a decorative image's
    // intentionally empty alt with the project title.
    expect(normalizeProjectMediaItem({ src: 'photo.jpg', alt: '' }, 'Fallback').alt).toBe('')
  })

  it('carries the poster through', () => {
    expect(
      normalizeProjectMediaItem({ src: 'clip.mp4', poster: 'poster.jpg' }, 'Fallback').poster,
    ).toBe('poster.jpg')
  })
})
