'use client'

import { useState, useEffect, useRef } from 'react'
import PostCard, { type PostCardData } from '@/components/posts/PostCard'
import { fetchMorePosts } from '@/app/actions/feed'

const PAGE_SIZE = 20

export default function InfinitePostFeed({
  initialPosts,
  inmediatosIds,
  tipo,
}: {
  initialPosts: PostCardData[]
  inmediatosIds: string[]
  // Si se pasa, solo carga más publicaciones de ese tipo (columnas del panel en desktop)
  tipo?: 'oferta' | 'requerimiento'
}) {
  const [posts, setPosts]       = useState(initialPosts)
  const [loading, setLoading]   = useState(false)
  const [hasMore, setHasMore]   = useState(initialPosts.length >= PAGE_SIZE)
  const [exhausted, setExhausted] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Proxy mutable para que el callback del observer acceda siempre al estado actual
  const stateRef = useRef({ posts: initialPosts, hasMore: initialPosts.length >= PAGE_SIZE, loading: false })
  stateRef.current.posts   = posts
  stateRef.current.hasMore = hasMore

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return
        const { loading: busy, hasMore: canLoad, posts: current } = stateRef.current
        if (busy || !canLoad) return

        const cursor = current[current.length - 1]?.created_at as string | undefined
        if (!cursor) return

        stateRef.current.loading = true
        setLoading(true)

        const newPosts = await fetchMorePosts({ cursor, excludeIds: inmediatosIds, tipo })

        if (newPosts.length < PAGE_SIZE) {
          setHasMore(false)
          setExhausted(true)
        }
        if (newPosts.length > 0) {
          setPosts(prev => [...prev, ...newPosts])
        }

        stateRef.current.loading = false
        setLoading(false)
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [inmediatosIds, tipo])

  return (
    <>
      <div className="flex flex-col gap-4">
        {posts.map(p => (
          <PostCard key={p.id} post={p} from="panel" />
        ))}
      </div>

      {/* Sentinel — el observer lo detecta antes de llegar al fondo */}
      <div ref={sentinelRef} className="h-1" />

      {loading && (
        <div className="flex justify-center py-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-surface-2 border-t-zinc-500" />
        </div>
      )}

      {exhausted && (
        <p className="py-6 text-center text-sm text-zinc-600">
          No hay más publicaciones por ahora.
        </p>
      )}
    </>
  )
}
