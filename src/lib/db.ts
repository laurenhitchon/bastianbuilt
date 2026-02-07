import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

let cachedDb: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (cachedDb) {
    return cachedDb
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL")
  }

  const client = neon(databaseUrl)
  cachedDb = drizzle(client)
  return cachedDb
}
