'use client'

import { cubicBezier, motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
        ease: cubicBezier(0.42, 0, 0.58, 1),
      },
    },
  }

  return (
    <section id='about' className='py-32'>
      <div className='container mx-auto px-6 lg:px-12'>
        <div className='max-w-4xl'>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className='mb-8 text-4xl font-bold md:text-5xl'
          >
            About
          </motion.h2>
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial='hidden'
            animate={isInView ? 'visible' : 'hidden'}
            className='space-y-6 text-lg leading-relaxed text-muted-foreground'
          >
            <motion.p variants={itemVariants}>
              I design and fabricate functional parts — from concept through to a finished, testable
              product.
            </motion.p>
            <motion.p variants={itemVariants}>
              My work blends practical engineering with modern digital design. I create accurate 3D
              models and assemblies, produce clear 2D drawings, and work confidently with
              engineering calculations and applied maths to make sure designs are fit-for-purpose.
              I’m comfortable interpreting standards and documentation, and I build with
              manufacturability and real-world constraints in mind.
            </motion.p>
            <motion.p variants={itemVariants}>
              In the workshop, I prototype fast and iterate quickly using my Bambu 3D printer. That
              lets me move from measurements or scans to CAD to physical parts — refining fitment,
              strength, and durability through hands-on testing. Whether it’s a protective cover, a
              custom mount, or a one-off component, I focus on clean design, reliable function, and
              repeatable fabrication.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='mt-12 grid grid-cols-1 gap-8 md:grid-cols-3'
          >
            {[
              {
                title: 'Expertise',
                items: [
                  'Fusion 360 CAD',
                  'Surface Modelling',
                  'Reverse Engineering (Scan/Measure → CAD)',
                  'Functional Part Design',
                  '3D Printing & Iteration',
                ],
              },
              {
                title: 'Processes',
                items: [
                  'FDM Printing (Bambu)',
                  'Carbon fibre / engineering filaments (e.g. PA-CF, ASA-CF)',
                  'Prototype fitment testing and revision cycles',
                  'Basic finishing and assembly (fasteners, inserts, adhesives)',
                ],
              },
              {
                title: 'Industries',
                items: [
                  'Motorcycle parts & protection',
                  'Automotive accessories and packaging (incl. interior-fit parts)',
                  'Custom brackets, mounts and hardware',
                  'One-off replacements and small-run functional components',
                ],
              },
            ].map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <h3 className='mb-2 text-xl font-bold'>{section.title}</h3>
                <ul className='space-y-2 text-muted-foreground'>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
