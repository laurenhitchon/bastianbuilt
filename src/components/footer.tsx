'use client'

import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className='border-t border-border py-12'>
      <div className='container mx-auto px-6 lg:px-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='flex flex-col items-center justify-between gap-4 md:flex-row'
        >
          <p className='text-sm text-muted-foreground'>
            © {new Date().getFullYear()} Bastian Built. All rights reserved.
          </p>
          <p className='text-sm text-muted-foreground'>Crafted with precision and passion</p>
        </motion.div>
      </div>
    </footer>
  )
}
