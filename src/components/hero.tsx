'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={ref}
      id='hero'
      className='relative flex min-h-screen items-center overflow-hidden pt-20'
    >
      <motion.div style={{ y, opacity }} className='container mx-auto px-6 lg:px-12'>
        <div className='max-w-4xl'>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.6, 0.05, 0.01, 0.9] }}
            className='mb-6 text-6xl font-bold text-balance md:text-8xl'
          >
            Industrial Design & 3D Printing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.6, 0.05, 0.01, 0.9] }}
            className='max-w-2xl text-xl leading-relaxed text-balance text-muted-foreground md:text-2xl'
          >
            Crafting precision-engineered products through Fusion 360 and advanced 3D printing
            technology. Transforming concepts into tangible innovation.
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className='pointer-events-none absolute top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[100px]'
      />
    </section>
  )
}
