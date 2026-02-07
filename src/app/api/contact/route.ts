import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'
import { contacts } from '@/lib/schema'

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const db = getDb()
    await db.insert(contacts).values({
      name,
      email,
      message,
      createdAt: new Date(),
    })

    // Send email via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Server email configuration missing' },
        { status: 500 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@bastianbuilt.com'
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>'

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[v0] Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 },
    )
  }
}
