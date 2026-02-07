import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex flex-1 items-center justify-center px-6'>
        <div className='text-center'>
          <h1 className='mb-4 text-6xl font-bold'>404</h1>
          <h2 className='mb-4 text-2xl font-semibold'>Project Not Found</h2>
          <p className='mb-8 text-muted-foreground'>
            The project you're looking for doesn't exist.
          </p>
          <Link
            href='/#work'
            className='inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90'
          >
            View All Projects
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
