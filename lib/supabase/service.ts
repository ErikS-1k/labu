import { createClient } from '@supabase/supabase-js'

// Cliente con privilegios de admin — bypasea RLS.
// Usar SOLO en Server Components o Server Actions, nunca en el cliente.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
