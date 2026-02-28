import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log("Auth callback received. Code present:", !!code);

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log("Auth exchange successful, redirecting to:", next);
            // Relative redirect is safer
            return NextResponse.redirect(new URL(next, request.url))
        } else {
            console.error("Auth exchange error:", error.message);
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
        }
    }

    console.warn("Auth callback: No code found in URL");
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}
