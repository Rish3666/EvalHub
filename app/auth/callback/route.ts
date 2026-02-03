import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getURL } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/feed'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Remove leading slash if 'next' has one, as getURL() provides the trailing slash
            const redirectPath = next.startsWith('/') ? next.slice(1) : next
            return NextResponse.redirect(`${getURL()}${redirectPath}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${getURL()}auth/auth-code-error`)
}
