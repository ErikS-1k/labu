import { notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { cargarChat, cargarConversaciones } from '@/lib/conversacion'
import BandejaMensajes from '@/components/mensajes/BandejaMensajes'

// Mobile: chat a pantalla completa (como siempre). Desktop: lista | este chat abierto a la derecha.
export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ conversation_id: string }>
}) {
  const { conversation_id } = await params
  const user = await getAuthUser()

  const [chat, conversaciones] = await Promise.all([
    cargarChat(conversation_id, user!.id),
    cargarConversaciones(user!.id),
  ])
  if (!chat) notFound()

  // La lista se cargó en paralelo con el "marcar como leído": el chat abierto ya no tiene no leídos
  const lista = conversaciones.map(c => c.conversation_id === conversation_id ? { ...c, unread: 0 } : c)

  return (
    <BandejaMensajes
      conversaciones={lista}
      currentUserId={user!.id}
      chatInicial={chat}
      enRutaChat
    />
  )
}
