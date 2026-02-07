'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Instagram, Mail } from 'lucide-react'

import type React from 'react'
import { useState } from 'react'

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: data.message })
        setFormData({ name: '', email: '', message: '' })
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to send message' })
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' })
      console.error('Error submitting contact form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id='contact' className='bg-secondary/30 py-32'>
      <div className='container mx-auto px-6 lg:px-12'>
        <div className='mx-auto max-w-4xl'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className='mb-16 text-center'
          >
            <h2 className='mb-4 text-4xl font-bold md:text-5xl'>Start a Project</h2>
            <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
              Have a project in mind? I&apos;m always interested in discussing new opportunities and
              innovative design challenges.
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-12 md:grid-cols-2'>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <form onSubmit={handleSubmit} className='space-y-6'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Input
                    type='text'
                    placeholder='Name'
                    className='border-border bg-background'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Input
                    type='email'
                    placeholder='Email'
                    className='border-border bg-background'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <Textarea
                    placeholder='Tell me about your project...'
                    rows={6}
                    className='resize-none border-border bg-background'
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </motion.div>
                {submitStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-4 ${
                      submitStatus.type === 'success'
                        ? 'border border-green-500/20 bg-green-500/10 text-green-500'
                        : 'border border-red-500/20 bg-red-500/10 text-red-500'
                    }`}
                  >
                    {submitStatus.message}
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <Button type='submit' size='lg' className='w-full' disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </motion.div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='flex flex-col justify-center space-y-8'
            >
              <div>
                <h3 className='mb-4 text-xl font-bold'>Connect</h3>
                <div className='space-y-4'>
                  {[
                    {
                      icon: Mail,
                      text: 'bastian@hitchon.me',
                      href: 'mailto:bastian@hitchon.me',
                    },
                    { icon: Instagram, text: 'Instagram', href: 'instagram.com/bastian.built/' },
                  ].map((link, index) => (
                    <motion.a
                      key={link.text}
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className='group flex items-center gap-3 text-muted-foreground transition-colors hover:text-primary'
                    >
                      <link.icon className='h-5 w-5' />
                      <span>{link.text}</span>
                    </motion.a>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <h3 className='mb-4 text-xl font-bold'>Location</h3>
                <p className='text-muted-foreground'>
                  Available for online projects
                  <br />
                  and local on-site consults
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
