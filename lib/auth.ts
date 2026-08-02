import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// cache() deduplica la llamada a getUser() dentro del mismo request.
// Tanto el layout como las páginas internas pueden llamar getAuthUser()
// sin hacer una segunda llamada de red a Supabase.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
