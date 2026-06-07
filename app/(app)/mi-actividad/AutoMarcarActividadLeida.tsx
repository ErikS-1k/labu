'use client'

import { useEffect } from 'react'
import { marcarActividadLeida } from '@/app/actions/notifications'

export default function AutoMarcarActividadLeida() {
  useEffect(() => {
    marcarActividadLeida()
  }, [])
  return null
}
