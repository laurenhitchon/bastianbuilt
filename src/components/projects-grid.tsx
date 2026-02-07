'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { normalizeProjectMediaItem } from '@/lib/media'
import { projects } from '@/lib/projects'
import { cubicBezier, motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

export function ProjectsGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: cubicBezier(0.42, 0, 0.58, 1), // instead of [0.42, 0, 0.58, 1]
      },
    },
  }

  return (
    <section id='work' className='bg-secondary/30 py-32'>
      <div className='container mx-auto px-6 lg:px-12'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className='mb-16'
        >
          <h2 className='mb-4 text-4xl font-bold md:text-5xl'>Selected Work</h2>
          <p className='max-w-2xl text-lg text-muted-foreground'>
            A collection of precision-engineered products showcasing the intersection of digital
            design and advanced manufacturing.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial='hidden'
          animate={isInView ? 'visible' : 'hidden'}
          className='grid grid-cols-1 gap-8 md:grid-cols-2'
        >
          {projects.map((project, index) => {
            const previewMedia = normalizeProjectMediaItem(
              project.image || '/placeholder.svg',
              `${project.title} - Preview`,
            )

            return (
              <motion.div key={index} variants={itemVariants}>
                <Link href={`/projects/${project.slug}`}>
                  <Card className='group h-full cursor-pointer overflow-hidden border-border bg-card pt-0 transition-all duration-300 hover:border-primary/50'>
                    <motion.div
                      className='aspect-[4/3] overflow-hidden bg-secondary'
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                    >
                      {previewMedia.type === 'video' ? (
                        <motion.video
                          className='h-full w-full object-cover'
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload='metadata'
                          poster={previewMedia.poster}
                          aria-label={previewMedia.alt}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <source src={previewMedia.src} />
                        </motion.video>
                      ) : (
                        <motion.img
                          src={previewMedia.src || '/placeholder.svg'}
                          alt={previewMedia.alt}
                          className='h-full w-full object-cover'
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                    <div className='p-6'>
                      <h3 className='mb-2 text-2xl font-bold transition-colors group-hover:text-primary'>
                        {project.title}
                      </h3>
                      <p className='mb-4 leading-relaxed text-muted-foreground'>
                        {project.description}
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {project.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant='secondary' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
