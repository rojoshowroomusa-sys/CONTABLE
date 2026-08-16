'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeSubscription(
  table: string,
  empresaId: string | null,
  callback: (payload: any) => void
) {
  const supabase = createClient()

  useEffect(() => {
    if (!empresaId) return

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `empresa_id=eq.${empresaId}`,
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, empresaId, callback, supabase])
}
