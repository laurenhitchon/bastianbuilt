import { projects } from '@/lib/projects'
import ProjectPageClient from './ProjectPageClient'

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return <ProjectPageClient slug={slug} />
}
