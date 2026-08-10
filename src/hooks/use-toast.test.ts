import { reducer } from '@/hooks/use-toast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// DISMISS_TOAST schedules a REMOVE_TOAST via setTimeout with a ~16 minute
// delay, so the timers are faked to keep the suite from leaving them pending.
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast reducer', () => {
  it('adds a toast to the front of the queue', () => {
    const next = reducer({ toasts: [] }, { type: 'ADD_TOAST', toast: { id: '1', title: 'First' } })

    expect(next.toasts).toHaveLength(1)
    expect(next.toasts[0]?.id).toBe('1')
  })

  it('enforces the single-toast limit by evicting the older toast', () => {
    // TOAST_LIMIT is 1, so adding a second toast replaces rather than stacks.
    const next = reducer(
      { toasts: [{ id: '1', title: 'First' }] },
      { type: 'ADD_TOAST', toast: { id: '2', title: 'Second' } },
    )

    expect(next.toasts).toHaveLength(1)
    expect(next.toasts[0]?.id).toBe('2')
  })

  it('updates only the toast with a matching id', () => {
    const next = reducer(
      { toasts: [{ id: '1', title: 'Original' }] },
      { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } },
    )

    expect(next.toasts[0]?.title).toBe('Updated')
  })

  it('leaves non-matching toasts untouched on update', () => {
    const next = reducer(
      { toasts: [{ id: '1', title: 'Original' }] },
      { type: 'UPDATE_TOAST', toast: { id: 'other', title: 'Updated' } },
    )

    expect(next.toasts[0]?.title).toBe('Original')
  })

  it('closes the targeted toast on dismiss without removing it', () => {
    // The toast stays in state so the exit animation can play; REMOVE_TOAST
    // is what actually drops it.
    const next = reducer(
      { toasts: [{ id: '1', open: true }] },
      { type: 'DISMISS_TOAST', toastId: '1' },
    )

    expect(next.toasts).toHaveLength(1)
    expect(next.toasts[0]?.open).toBe(false)
  })

  it('closes every toast when dismiss is called without an id', () => {
    const next = reducer(
      {
        toasts: [
          { id: '1', open: true },
          { id: '2', open: true },
        ],
      },
      { type: 'DISMISS_TOAST' },
    )

    expect(next.toasts.every((toast) => toast.open === false)).toBe(true)
  })

  it('removes the targeted toast', () => {
    const next = reducer(
      { toasts: [{ id: '1' }, { id: '2' }] },
      { type: 'REMOVE_TOAST', toastId: '1' },
    )

    expect(next.toasts.map((toast) => toast.id)).toEqual(['2'])
  })

  it('clears every toast when remove is called without an id', () => {
    const next = reducer(
      { toasts: [{ id: '1' }, { id: '2' }] },
      { type: 'REMOVE_TOAST', toastId: undefined },
    )

    expect(next.toasts).toEqual([])
  })
})
