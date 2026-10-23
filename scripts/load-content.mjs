#!/usr/bin/env node
// Loads content/ into the site's own Supabase database: how a site that started with its content as files
// moves to its own database. Every entry is written as it stands in the files (existing ones are replaced).
//
//   npm run load-content                    loads everything
//   npm run load-content -- --admin <email> also lets that person edit (adding them to the project if needed)
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, and supabase/migrations applied.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.')
    process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })
const model = JSON.parse(await readFile(new URL('../src/content/model.json', import.meta.url), 'utf8'))
const root = new URL('../content/', import.meta.url).pathname
const json = async (path) => JSON.parse(await readFile(path, 'utf8'))
const entries = []

for (const locale of model.locales) {
    for (const { name } of model.singletons) {
        try {
            entries.push({ kind: 'singleton', name, slug: '', locale, data: await json(join(root, locale, `${name}.json`)) })
        } catch (e) {
            if (e.code !== 'ENOENT') throw e
        }
    }
    for (const { name } of model.collections) {
        let files = []
        try { files = (await readdir(join(root, locale, name))).filter((f) => f.endsWith('.json')) } catch (e) { if (e.code !== 'ENOENT') throw e }
        for (const file of files) {
            const { position = 0, ...data } = await json(join(root, locale, name, file))
            entries.push({ kind: 'item', name, slug: file.slice(0, -5), locale, position, data })
        }
    }
}

const { error } = await db.from('cms_entries').upsert(entries, { onConflict: 'kind,name,slug,locale' })
if (error) throw error
console.log(`Loaded ${entries.length} entries.`)

const at = process.argv.indexOf('--admin')
if (at > 0) {
    const email = process.argv[at + 1]
    const { data, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 })
    if (listError) throw listError
    let user = data.users.find((u) => u.email?.toLowerCase() === email?.toLowerCase())
    if (!user) {
        const created = await db.auth.admin.createUser({ email, email_confirm: true })
        if (created.error) throw created.error
        user = created.data.user
    }
    const { error: adminError } = await db.from('cms_admins').upsert({ user_id: user.id })
    if (adminError) throw adminError
    console.log(`${email} may edit the site.`)
}
