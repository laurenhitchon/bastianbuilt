// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bastian.com.au').replace(/\/+$/, '')

function resolveAppDir() {
  const root = process.cwd()

  const candidates = [path.join(root, 'app'), path.join(root, 'src', 'app')]

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p
  }

  // If you're in a monorepo, this helps you spot it fast:
  throw new Error(
    `Could not find Next app directory. Looked in:\n- ${candidates.join('\n- ')}\n` +
      `process.cwd() was: ${root}`,
  )
}

const APP_DIR = resolveAppDir()

// 1) Ignore folders (anywhere in the app tree)
const IGNORE_DIR_NAMES = new Set(['api', 'components'])

// 2) Ignore specific URL paths (exact)
const IGNORE_EXACT_ROUTES = new Set<string>([
  // "/dashboard",
  // "/builder/internal",
])

// 3) Ignore by prefix (anything under these paths)
const IGNORE_ROUTE_PREFIXES: string[] = [
  // "/data", // ignores /data/*
]

function isIgnoredRoute(route: string) {
  if (IGNORE_EXACT_ROUTES.has(route)) return true
  return IGNORE_ROUTE_PREFIXES.some(
    (prefix) => route === prefix || route.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`),
  )
}

function isDynamicSegment(seg: string) {
  return seg.startsWith('[') && seg.endsWith(']')
}

function isRouteGroup(seg: string) {
  return seg.startsWith('(') && seg.endsWith(')')
}

function filePathToRoute(filePath: string) {
  const rel = path.relative(APP_DIR, filePath).replaceAll(path.sep, '/')

  const withoutPage = rel.replace(/\/page\.(tsx|ts|jsx|js)$/, '')

  const segments = withoutPage
    .split('/')
    .filter(Boolean)
    .filter((seg) => !isRouteGroup(seg)) // drop (home) etc.

  // skip dynamic routes like /templates/[slug]
  if (segments.some(isDynamicSegment)) return null

  const route = '/' + segments.join('/')
  const normalized = route === '/' ? '/' : route.replace(/\/$/, '')

  if (isIgnoredRoute(normalized)) return null

  return normalized
}

function walkForPages(dir: string): string[] {
  const out: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    // skip underscored folders/files (private convention)
    if (entry.name.startsWith('_')) continue

    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(entry.name)) continue
      out.push(...walkForPages(full))
      continue
    }

    // only include page.(ts|tsx|js|jsx)
    if (!/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) continue

    out.push(full)
  }

  return out
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pageFiles = walkForPages(APP_DIR)

  const routes = pageFiles.map(filePathToRoute).filter((r): r is string => Boolean(r))

  const uniqueRoutes = Array.from(new Set(routes)).sort()

  const now = new Date()
  return uniqueRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }))
}
