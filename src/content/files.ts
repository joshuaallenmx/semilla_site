// Content as files in the repo: content/<locale>/<singleton>.json, and content/<locale>/<collection>/<slug>.json
// with a `position` for the order. Read at build and request time; edited through the repo, not the admin.
import 'server-only'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Data, Item } from './model'

const ROOT = join(process.cwd(), 'content')

async function read(path: string): Promise<Data | null> {
    try {
        return JSON.parse(await readFile(path, 'utf8'))
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw e
    }
}

export const singleton = (name: string, locale: string) => read(join(ROOT, locale, `${name}.json`))

export async function items(collection: string, locale: string): Promise<Item[]> {
    let names: string[]
    try {
        names = (await readdir(join(ROOT, locale, collection))).filter((n) => n.endsWith('.json'))
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw e
    }
    const found = await Promise.all(names.map((n) => item(collection, n.slice(0, -5), locale)))
    return (found.filter(Boolean) as Item[]).sort((a, b) => a.position - b.position)
}

export async function item(collection: string, slug: string, locale: string): Promise<Item | null> {
    const file = await read(join(ROOT, locale, collection, `${slug}.json`))
    if (!file) return null
    const { position = 0, ...data } = file
    return { slug, position: Number(position), data }
}
