// Where the site's content comes from: the site's own Supabase database when it has one, otherwise the files
// in content/ (a site that has not moved to its own database yet). Both hold the same model, so a site
// changes source by loading its files into the database (npm run load-content) and setting two variables.
//
// A missing translation falls back to the main language, so a page is never empty in another one.
import 'server-only'
import { MAIN_LOCALE, type Data, type Item } from './model'
import * as files from './files'
import * as database from './database'

export interface Source {
    singleton(name: string, locale: string): Promise<Data | null>
    items(collection: string, locale: string): Promise<Item[]>
    item(collection: string, slug: string, locale: string): Promise<Item | null>
}

export const usesDatabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
const source = (): Source => (usesDatabase() ? database : files)

export async function singleton(name: string, locale: string): Promise<Data> {
    return (await source().singleton(name, locale)) ?? (locale === MAIN_LOCALE ? null : await source().singleton(name, MAIN_LOCALE)) ?? {}
}

export async function items(collection: string, locale: string): Promise<Item[]> {
    const found = await source().items(collection, locale)
    if (locale === MAIN_LOCALE) return found
    const main = await source().items(collection, MAIN_LOCALE)
    const translated = new Map(found.map((i) => [i.slug, i]))
    return main.map((i) => translated.get(i.slug) ?? i)
}

export async function item(collection: string, slug: string, locale: string): Promise<Item | null> {
    return (await source().item(collection, slug, locale)) ?? (locale === MAIN_LOCALE ? null : await source().item(collection, slug, MAIN_LOCALE))
}
