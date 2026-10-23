// After the admin saves, the site's pages are rebuilt with the new content at once, for an admin only.
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token || !process.env.NEXT_PUBLIC_SUPABASE_URL) return new Response(null, { status: 401 })
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { persistSession: false },
        global: { headers: { authorization: `Bearer ${token}` } },
    })
    const { data } = await db.rpc('is_cms_admin')
    if (data !== true) return new Response(null, { status: 403 })
    revalidatePath('/', 'layout')
    return new Response(null, { status: 204 })
}
