'use client'

import { useEffect } from 'react'
import { marcarTodasLeidas } from '@/app/actions/notifications'

export default function AutoMarcarLeidas() {
  useEffect(() => {
    marcarTodasLeidas()
  }, [])
  return null
}
