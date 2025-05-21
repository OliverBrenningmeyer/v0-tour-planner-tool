import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a single supabase client for the entire application
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Client-side singleton
let clientSideSupabase: ReturnType<typeof createSupabaseClient> | null = null

// Client-side supabase client (to be used in client components)
export const getSupabaseClient = () => {
  if (!clientSideSupabase) {
    clientSideSupabase = createSupabaseClient()
  }
  return clientSideSupabase
}

// Server-side supabase client (to be used in server components and server actions)
export const createServerSupabaseClient = () => {
  return createSupabaseClient()
}
