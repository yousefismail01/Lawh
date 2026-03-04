import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import * as schema from './schema'

// Use openDatabaseSync (SDK 53+ API) — NOT the deprecated openDatabase callback API
const sqlite = openDatabaseSync('lawh.db')
export const db = drizzle(sqlite, { schema })
