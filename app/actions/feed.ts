'use server'

import { createClient } from '@/lib/supabase/server'
import type { PostCardData } from '@/components/posts/PostCard'

const postSelect = 'id, user_id, type, title, description, category, modality, presencialidad, temporal_duration, price, price_type, location, created_at, users(username, first_name, fecha_nacimiento, rating_avg, avatar_url)'

export async function fetchMorePosts({
  cursor,
  excludeIds = [],
}: {
  cursor: string
  excludeIds?: string[]
}): Promise<PostCardData[]> {
  const limit = 20
  const supabase = await createClient()

  // Pedimos un poco más para compensar los excludeIds que vamos a filtrar
  const { data } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('is_active', true)
    .lt('created_at', cursor)
    .order('created_at', { ascending: false })
    .limit(limit + excludeIds.length)

  if (!data) return []

  const excludeSet = new Set(excludeIds)
  return data
    .filter((p: any) => !excludeSet.has(p.id as string))
    .slice(0, limit) as unknown as PostCardData[]
}
