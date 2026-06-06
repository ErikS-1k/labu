import { useEffect } from 'react'
import NProgress from 'nprogress'

export function useProgress(pending: boolean) {
  useEffect(() => {
    if (pending) NProgress.start()
    else NProgress.done()
  }, [pending])
}
