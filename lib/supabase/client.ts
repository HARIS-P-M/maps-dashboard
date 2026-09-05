// lib/supabase/client.ts
// Browser-side Supabase client (use in Client Components)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars.\n' +
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local\n' +
    'Get them at: https://supabase.com → your project → Settings → API'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
