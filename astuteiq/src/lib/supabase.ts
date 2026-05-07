// Supabase client — configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
// ⚠️  The anon key is safe to expose client-side; it is scoped by Row Level Security.
//     Never expose your service_role key here.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
