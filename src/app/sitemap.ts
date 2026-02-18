import type { MetadataRoute } from 'next'
import { projects } from '@/lib/projects'

const FALLBACK_BASE_URL = 'https://www.bastian.com.au'

function normalizeBaseUrl(raw: string): string {
  let parsed: URL

  try {
    parsed = new URL(raw)
  } catch {
    return FALLBACK_BASE_URL
  }

  // Keep only origin to avoid accidental paths like "/sitemap.xml" in env values.
  return parsed.origin.replace(/\/+$/, '')
}

const baseUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_BASE_URL,
)

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', ...projects.map((project) => `/projects/${project.slug}`)]
  const uniqueRoutes = Array.from(new Set(routes))
  const now = new Date()

  return uniqueRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }))
}
