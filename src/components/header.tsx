'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isProjectPage = pathname?.startsWith('/projects/')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavigation = (section: string) => {
    if (isProjectPage) {
      router.push(`/#${section}`)
    } else {
      const element = document.getElementById(section)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled ? 'border-b border-border bg-background/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className='container mx-auto px-6 lg:px-12'>
        <div className='flex h-20 items-center justify-between'>
          <Link href='/' className='relative flex h-10 w-48 items-center'>
            <motion.div
              className='relative h-full w-full'
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src='/wordmark.svg'
                alt='Bastian Built'
                fill
                className='object-contain object-left invert'
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden items-center gap-8 md:flex'>
            {['work', 'about', 'contact'].map((section, i) => (
              <motion.button
                key={section}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                onClick={() => handleNavigation(section)}
                className='group relative text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                <motion.span
                  className='absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full'
                  whileHover={{ width: '100%' }}
                />
              </motion.button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label='Toggle menu'
          >
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>
        </div>

        {/* Mobile Navigation with AnimatePresence */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className='overflow-hidden border-t border-border py-6 md:hidden'
            >
              <div className='flex flex-col gap-4'>
                {['work', 'about', 'contact'].map((section, i) => (
                  <motion.button
                    key={section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    onClick={() => handleNavigation(section)}
                    className='py-2 text-left text-foreground transition-colors hover:text-primary'
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
