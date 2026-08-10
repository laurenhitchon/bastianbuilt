import { cn } from '@/lib/utils'
import { describe, expect, it } from 'vitest'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('drops falsy values', () => {
    expect(cn('flex', false, null, undefined, '', 'gap-2')).toBe('flex gap-2')
  })

  it('accepts arrays and conditional objects', () => {
    expect(cn(['flex', 'gap-2'], { 'sr-only': false, 'font-bold': true })).toBe(
      'flex gap-2 font-bold',
    )
  })

  it('resolves conflicting Tailwind utilities in favour of the last one', () => {
    // This is the whole reason cn wraps twMerge rather than just clsx: without
    // it, `cn('p-2', props.className)` would emit both and let source order in
    // the stylesheet decide the winner.
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('keeps non-conflicting utilities from the same group', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('lets a caller override a base class', () => {
    const base = 'rounded-md bg-black'
    expect(cn(base, 'bg-white')).toBe('rounded-md bg-white')
  })
})
