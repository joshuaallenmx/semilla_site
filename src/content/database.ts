// Content in the site's own Supabase database (supabase/migrations/0001_cms.sql): one table, cms_entries,
// where a singleton is the entry with no slug. Only published entries are readable without signing in.
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Data, Item } from './model'

const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
})

const entries = () => client().from('cms_entries').select('slug, position, data').eq('published', true)

export async function singleton(name: string, locale: string): Promise<Data | null> {
    const { data, error } = await entries().eq('kind', 'singleton').eq('name', name).eq('locale', locale).maybeSingle()
    if (error) throw error
    return (data?.data as Data) ?? null
}

export async function items(collection: string, locale: string): Promise<Item[]> {
    const { data, error } = await entries().eq('kind', 'item').eq('name', collection).eq('locale', locale).order('position')
    if (error) throw error
    return (data ?? []) as Item[]
}

export async function item(collection: string, slug: string, locale: string): Promise<Item | null> {
    const { data, error } = await entries().eq('kind', 'item').eq('name', collection).eq('slug', slug).eq('locale', locale).maybeSingle()
    if (error) throw error
    return (data as Item) ?? null
}
