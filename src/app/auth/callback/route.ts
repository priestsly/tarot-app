import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle OAuth/Magic Link errors
    if (error) {
        console.error('OAuth error:', error, error_description)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url))
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Başarılı giriş sonrası yönlendir
            return NextResponse.redirect(new URL(next, request.url))
        } else {
            console.error('Code exchange error:', error)
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
        }
    }

    // No code, redirect to login
    return NextResponse.redirect(new URL(`/login?error=Giriş%20sırasında%20bir%20hata%20oluştu`, request.url))
}

