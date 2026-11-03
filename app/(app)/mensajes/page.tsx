import { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth'
import { cargarConversaciones } from '@/lib/conversacion'
import BandejaMensajes from '@/components/mensajes/BandejaMensajes'

export const metadata: Metadata = { title: 'Mensajes — Labu' }

// Mobile: lista de conversaciones. Desktop: lista | chat (ver BandejaMensajes).
export default async function MensajesPage() {
  const user = await getAuthUser()
  const conversaciones = await cargarConversaciones(user!.id)
  return <BandejaMensajes conversaciones={conversaciones} currentUserId={user!.id} />
}
