'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, minimum: 0.15, speed: 300 })

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Cierra la barra al completar cualquier navegación de ruta
  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  return (
    <style>{`
      #nprogress { pointer-events: none; }
      #nprogress .bar {
        background: #3b82f6;
        position: fixed;
        z-index: 9999;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px #3b82f6, 0 0 5px #3b82f6;
        opacity: 1;
        transform: rotate(3deg) translate(0, -4px);
      }
    `}</style>
  )
}
