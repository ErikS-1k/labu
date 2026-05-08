import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mensajes — Labu' }

type MensajeRow = {
  conversation_id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  receiver_id: string
  post_id: string | null
  post: { id: string; title: string } | null
  sender: { username: string | null; first_name: string | null } | null
  receiver: { username: string | null; first_name: string | null } | null
}

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('messages')
    .select(`
      conversation_id, content, created_at, read, sender_id, receiver_id, post_id,
      post:posts(id, title),
      sender:sender_id(username, first_name),
      receiver:receiver_id(username, first_name)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Quedar con el último mensaje por conversación
  const conversaciones = Object.values(
    ((rows ?? []) as unknown as MensajeRow[]).reduce<Record<string, MensajeRow>>(
      (acc, msg) => { if (!acc[msg.conversation_id]) acc[msg.conversation_id] = msg; return acc },
      {}
    )
  )

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Mensajes</h1>

      {conversaciones.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">
          No tenés conversaciones todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversaciones.map(conv => {
            const otro = conv.sender_id === user.id ? conv.receiver : conv.sender
            const nombre = otro?.first_name ?? otro?.username ?? 'Usuario'
            const noLeido = !conv.read && conv.receiver_id === user.id

            return (
              <Link
                key={conv.conversation_id}
                href={`/mensajes/${conv.conversation_id}`}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
                  {nombre[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm font-medium ${noLeido ? 'text-zinc-900' : 'text-zinc-600'}`}>
                      {nombre}
                    </p>
                    {noLeido && <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-900" />}
                  </div>
                  {conv.post && (
                    <p className="truncate text-xs text-zinc-400">Re: {conv.post.title}</p>
                  )}
                  <p className="mt-0.5 truncate text-sm text-zinc-400">{conv.content}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
