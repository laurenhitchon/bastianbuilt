'use client'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { normalizeProjectMediaItem } from '@/lib/media'
import { getProjectBySlug } from '@/lib/projects'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useRef, useState } from 'react'

export default function ProjectPageClient({ slug }: { slug: string }) {
  const project = getProjectBySlug(slug)
  const heroRef = useRef(null)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  if (!project) {
    notFound()
  }

  const heroMedia = normalizeProjectMediaItem(
    project.image || '/placeholder.svg',
    `${project.title} - Hero`,
  )

  const galleryItems = project.gallery.map((item, index) =>
    normalizeProjectMediaItem(item, `${project.title} - Media ${index + 1}`),
  )

  const nextMedia = () => {
    if (selectedMediaIndex !== null && galleryItems.length > 0) {
      setSelectedMediaIndex((selectedMediaIndex + 1) % galleryItems.length)
    }
  }

  const prevMedia = () => {
    if (selectedMediaIndex !== null && galleryItems.length > 0) {
      setSelectedMediaIndex((selectedMediaIndex - 1 + galleryItems.length) % galleryItems.length)
    }
  }

  const selectedMedia = selectedMediaIndex !== null ? galleryItems[selectedMediaIndex] : null
  const selectedIndex = selectedMediaIndex ?? 0

  return (
    <div className='min-h-screen'>
      <Header />
      <main className='pt-24'>
        {/* Added parallax hero section with Framer Motion */}
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className='relative h-[60vh] min-h-[500px] overflow-hidden bg-secondary'
        >
          {heroMedia.type === 'video' ? (
            <motion.video
              style={{ y }}
              className='absolute inset-0 h-full w-full object-cover'
              autoPlay
              muted
              loop
              playsInline
              preload='metadata'
              poster={heroMedia.poster}
              aria-label={heroMedia.alt}
            >
              <source src={heroMedia.src} />
            </motion.video>
          ) : (
            <motion.img
              style={{ y }}
              src={heroMedia.src || '/placeholder.svg'}
              alt={heroMedia.alt}
              className='absolute inset-0 h-full w-full object-cover'
            />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20' />
          <motion.div
            style={{ opacity }}
            className='relative container mx-auto flex h-full flex-col justify-end px-6 pb-16 lg:px-12'
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href='/#work'
                className='mb-8 inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground'
              >
                <ArrowLeft className='h-4 w-4' />
                Back to Work
              </Link>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.6, 0.05, 0.01, 0.9] }}
              className='mb-4 text-5xl font-bold text-balance md:text-6xl lg:text-7xl'
            >
              {project.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
              className='max-w-3xl text-xl text-balance text-muted-foreground md:text-2xl'
            >
              {project.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className='mt-6 flex flex-wrap gap-2'
            >
              {project.tags.map((tag, index) => (
                <Badge key={index} variant='secondary' className='text-sm'>
                  {tag}
                </Badge>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Added fade-in animation to overview section */}
        <section className='bg-background py-20'>
          <div className='container mx-auto px-6 lg:px-12'>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
              className='max-w-4xl'
            >
              <h2 className='mb-6 text-3xl font-bold md:text-4xl'>Overview</h2>
              <p className='text-lg leading-relaxed text-muted-foreground'>{project.overview}</p>
            </motion.div>
          </div>
        </section>

        {/* Added staggered animations to features and specs */}
        <section className='bg-secondary/30 py-20'>
          <div className='container mx-auto px-6 lg:px-12'>
            <div className='grid gap-12 lg:grid-cols-2'>
              {/* Features */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
              >
                <h2 className='mb-8 text-3xl font-bold md:text-4xl'>Key Features</h2>
                <div className='space-y-4'>
                  {project.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className='flex gap-3'
                    >
                      <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20'>
                        <Check className='h-4 w-4 text-primary' />
                      </div>
                      <p className='leading-relaxed text-muted-foreground'>{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Specifications */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
              >
                <h2 className='mb-8 text-3xl font-bold md:text-4xl'>Specifications</h2>
                <Card className='border-border bg-card p-6'>
                  <dl className='space-y-4'>
                    {project.specs.map((spec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className='flex justify-between border-b border-border/50 py-3 last:border-0'
                      >
                        <dt className='font-medium text-muted-foreground'>{spec.label}</dt>
                        <dd className='text-right font-semibold text-foreground'>{spec.value}</dd>
                      </motion.div>
                    ))}
                  </dl>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Added animated process steps */}
        <section className='bg-background py-20'>
          <div className='container mx-auto px-6 lg:px-12'>
            <div className='max-w-4xl'>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                className='mb-8 text-3xl font-bold md:text-4xl'
              >
                Design Process
              </motion.h2>
              <div className='space-y-6'>
                {project.process.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className='flex items-start gap-6'
                  >
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20'>
                      <span className='font-bold text-primary'>{index + 1}</span>
                    </div>
                    <div className='flex-1 pt-1.5'>
                      <p className='text-lg leading-relaxed text-muted-foreground'>{step}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Added staggered gallery animations */}
        <section className='bg-secondary/30 py-20'>
          <div className='container mx-auto px-6 lg:px-12'>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className='mb-12 text-3xl font-bold md:text-4xl'
            >
              Gallery
            </motion.h2>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {galleryItems.map((media, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedMediaIndex(index)}
                  className='aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-secondary'
                >
                  {media.type === 'video' ? (
                    <video
                      className='h-full w-full object-cover'
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload='metadata'
                      poster={media.poster}
                      aria-label={media.alt}
                    >
                      <source src={media.src} />
                    </video>
                  ) : (
                    <img
                      src={media.src || '/placeholder.svg'}
                      alt={media.alt}
                      className='h-full w-full object-cover'
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Added animated CTA button */}
        <section className='bg-background py-20'>
          <div className='container mx-auto px-6 text-center lg:px-12'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href='/#work'
                className='inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90'
              >
                View All Projects
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMediaIndex(null)}
            className='fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm'
          >
            <button
              onClick={() => setSelectedMediaIndex(null)}
              className='absolute top-4 right-4 z-10 rounded-full bg-secondary/80 p-2 transition-colors hover:bg-secondary'
            >
              <X className='h-6 w-6' />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                prevMedia()
              }}
              className='absolute left-4 z-10 rounded-full bg-secondary/80 p-2 transition-colors hover:bg-secondary'
            >
              <ChevronLeft className='h-6 w-6' />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                nextMedia()
              }}
              className='absolute right-4 z-10 rounded-full bg-secondary/80 p-2 transition-colors hover:bg-secondary'
            >
              <ChevronRight className='h-6 w-6' />
            </button>

            {selectedMedia.type === 'video' ? (
              <motion.video
                key={selectedIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={selectedMedia.src}
                className='max-h-[90vh] max-w-full rounded-lg object-contain'
                controls
                autoPlay
                playsInline
                poster={selectedMedia.poster}
                aria-label={selectedMedia.alt}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                key={selectedIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={selectedMedia.src || '/placeholder.svg'}
                alt={selectedMedia.alt}
                className='max-h-[90vh] max-w-full rounded-lg object-contain'
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground'>
              {selectedIndex + 1} / {galleryItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
