'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UserPresenceUpdater() {
    const supabase = createClient()

    useEffect(() => {
        const updatePresence = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Update user status to online
            await supabase
                .from('users')
                .update({
                    online_status: 'online',
                    last_seen: new Date().toISOString()
                })
                .eq('id', session.user.id)
        }

        // Update immediately
        updatePresence()

        // Update every 2 minutes
        const interval = setInterval(updatePresence, 2 * 60 * 1000)

        // Set to offline on unload
        const handleUnload = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // Determine if we can use navigator.sendBeacon for cleaner exit
                const data = JSON.stringify({ online_status: 'offline', last_seen: new Date().toISOString() })
                // Note: sendBeacon doesn't support custom headers easily for Supabase, 
                // so we rely on the heartbeat. If the heartbeat stops, we can infer offline 
                // after a threshold in the UI.
            }
        }

        window.addEventListener('beforeunload', handleUnload)

        return () => {
            clearInterval(interval)
            window.removeEventListener('beforeunload', handleUnload)
        }
    }, [])

    return null
}
