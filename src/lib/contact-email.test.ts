import { escapeHtml, renderContactEmail } from '@/lib/contact-email'
import { describe, expect, it } from 'vitest'

describe('escapeHtml', () => {
  it('escapes every character that can break out of markup', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('escapes the ampersand of an existing entity so it cannot be smuggled through', () => {
    expect(escapeHtml('&lt;img&gt;')).toBe('&amp;lt;img&amp;gt;')
  })

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Hello, world 123')).toBe('Hello, world 123')
  })

  it('escapes every occurrence, not just the first', () => {
    expect(escapeHtml('<b><i>')).toBe('&lt;b&gt;&lt;i&gt;')
  })
})

describe('renderContactEmail', () => {
  const render = (overrides: Partial<Parameters<typeof renderContactEmail>[0]> = {}) =>
    renderContactEmail({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Hello there',
      ...overrides,
    })

  it('escapes markup in every field', () => {
    const { html } = render({
      name: '<img src=x onerror=alert(1)>',
      email: '"><script>alert(1)</script>',
      message: '<a href="https://evil.example">Reset your password</a>',
    })

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&quot;&gt;&lt;script&gt;')
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;')
    // Nothing but the tags the template itself writes may appear.
    expect(html).not.toMatch(/<(?!\/?(?:h2|p|strong|br)\b)/)
  })

  it('turns newlines into line breaks', () => {
    expect(render({ message: 'first\nsecond' }).html).toContain('first<br>second')
  })

  it('normalises CRLF to a single line break', () => {
    expect(render({ message: 'first\r\nsecond' }).html).toContain('first<br>second')
  })

  it('escapes a break tag the sender typed while keeping the ones it inserts', () => {
    // Guards the escape-then-substitute order: escaping afterwards would turn
    // the inserted markup into a literal `&lt;br&gt;`.
    const { html } = render({ message: '<br>\nreal break' })

    expect(html).toContain('&lt;br&gt;<br>real break')
  })

  it('strips CR/LF from the subject', () => {
    const { subject } = render({ name: 'Ada\r\nBcc: victim@example.com' })

    expect(subject).toBe('New Contact Form Submission from Ada Bcc: victim@example.com')
  })

  it('sends a plain text alternative carrying the unescaped fields', () => {
    const { text } = render({ name: 'Ada & Co', message: 'first\nsecond' })

    expect(text).toContain('Name: Ada & Co')
    expect(text).toContain('Email: ada@example.com')
    expect(text).toContain('first\nsecond')
    expect(text).not.toContain('<br>')
  })
})
