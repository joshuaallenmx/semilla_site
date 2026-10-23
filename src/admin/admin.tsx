'use client'
// The site's own admin: its owner signs in with a magic link and edits the content in the site's database,
// every singleton and collection of model.json, in every language. It works without semilla.
import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@newtone-dev/ui-react-web/button'
import { Icon } from '@newtone-dev/ui-react-web/icon'
import { Shell } from '@newtone-dev/ui-react-web/shell'
import { Text } from '@newtone-dev/ui-react-web/text'
import { TextField } from '@newtone-dev/ui-react-web/text-field'
import { Wrapper } from '@newtone-dev/ui-react-web/wrapper'
import { LOCALES, MAIN_LOCALE, MODEL, type Collection, type Data, type Singleton } from '../content/model'
import { configured, supabase } from './client'
import { FieldEditor, read } from './fields'

type Place = { kind: 'singleton'; name: string } | { kind: 'item'; name: string; slug?: string }
type Entry = { slug: string; position: number; data: Data }

const singletonOf = (name: string) => MODEL.singletons.find((s) => s.name === name) as Singleton
const collectionOf = (name: string) => MODEL.collections.find((c) => c.name === name) as Collection
const titleOf = (e: Entry) => String(e.data.title ?? e.data.name ?? e.slug)

// Pages show new content within a minute anyway; this makes it immediate.
async function revalidate(session: Session) {
    await fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${session.access_token}` } }).catch(() => {})
}

function SignIn() {
    const [sent, setSent] = useState(false)
    async function submit(e: FormEvent<HTMLElement>) {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget as HTMLFormElement).get('email') ?? '').trim()
        const { error } = await supabase().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/admin` } })
        setSent(!error)
    }
    return (
        <Wrapper direction="column" gap={5} padding={8}>
            <Text as="h1" scale="display-md">Sign in</Text>
            {sent ? (
                <Text as="p" scale="body">If this address may edit the site, a link to sign in is on its way.</Text>
            ) : (
                <Wrapper as="form" direction="column" gap={4} onSubmit={submit}>
                    <TextField label="Email" name="email" type="email" required autoComplete="email" />
                    <Button type="submit">Send me a link</Button>
                </Wrapper>
            )}
        </Wrapper>
    )
}

function Editor({ place, locale, session, onSaved }: { place: Place; locale: string; session: Session; onSaved: () => void }) {
    const fields = place.kind === 'singleton' ? singletonOf(place.name).fields : collectionOf(place.name).fields
    const slug = place.kind === 'item' ? (place.slug ?? '') : ''
    const [data, setData] = useState<Data | null>(null)
    const [state, setState] = useState('')
    useEffect(() => {
        setData(null)
        if (place.kind === 'item' && !place.slug) return setData({})
        supabase().from('cms_entries').select('data').eq('kind', place.kind).eq('name', place.name).eq('slug', slug).eq('locale', locale).maybeSingle()
            .then(({ data: row }) => setData((row?.data as Data) ?? {}))
    }, [place, locale, slug])

    async function save(e: FormEvent<HTMLElement>) {
        e.preventDefault()
        const form = new FormData(e.currentTarget as HTMLFormElement)
        const next = Object.fromEntries(fields.map((f) => [f.name, read(form, f)]))
        const newSlug = place.kind === 'item' ? (slug || String(form.get('__slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) : ''
        if (place.kind === 'item' && !newSlug) return setState('Give it an address first.')
        setState('Saving…')
        const { error } = await supabase().from('cms_entries').upsert(
            { kind: place.kind, name: place.name, slug: newSlug, locale, data: next, updated_at: new Date().toISOString() },
            { onConflict: 'kind,name,slug,locale' },
        )
        if (error) return setState('It could not be saved.')
        await revalidate(session)
        setState('Saved.')
        onSaved()
    }

    if (!data) return <Text as="p" scale="body">Loading…</Text>
    return (
        <Wrapper as="form" key={`${place.name}/${slug}/${locale}`} direction="column" gap={6} onSubmit={save}>
            {place.kind === 'item' && !slug && <TextField label="Address" name="__slug" hint="The end of the page's address, e.g. my-first-project." required />}
            {fields.map((field) => <FieldEditor key={field.name} field={field} value={data[field.name]} />)}
            <Wrapper direction="row" gap={4} align="middle-left">
                <Button type="submit">Save</Button>
                {state && <Text as="p" scale="body-sm">{state}</Text>}
            </Wrapper>
        </Wrapper>
    )
}

function Items({ name, locale, onOpen }: { name: string; locale: string; onOpen: (slug?: string) => void }) {
    const [entries, setEntries] = useState<Entry[] | null>(null)
    const load = () => supabase().from('cms_entries').select('slug, position, data').eq('kind', 'item').eq('name', name).eq('locale', locale).order('position')
        .then(({ data }) => setEntries((data as Entry[]) ?? []))
    useEffect(() => { load() }, [name, locale])

    // Order is the same in every language: moving an item moves all its translations.
    async function move(i: number, by: number) {
        const list = [...entries!]
        const [it] = list.splice(i, 1)
        list.splice(i + by, 0, it)
        await Promise.all(list.map((e, position) => supabase().from('cms_entries').update({ position }).eq('kind', 'item').eq('name', name).eq('slug', e.slug)))
        load()
    }
    async function remove(slug: string) {
        await supabase().from('cms_entries').delete().eq('kind', 'item').eq('name', name).eq('slug', slug)
        load()
    }

    if (!entries) return <Text as="p" scale="body">Loading…</Text>
    return (
        <Wrapper direction="column" gap={4}>
            {entries.map((e, i) => (
                <Wrapper key={e.slug} direction="row" gap={3} align="middle-left" wrap>
                    <Button variant="tertiary" onClick={() => onOpen(e.slug)}>{titleOf(e)}</Button>
                    <Button variant="tertiary" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>Up</Button>
                    <Button variant="tertiary" size="sm" disabled={i === entries.length - 1} onClick={() => move(i, 1)}>Down</Button>
                    <Button variant="tertiary" size="sm" onClick={() => remove(e.slug)}>Delete</Button>
                </Wrapper>
            ))}
            <Button variant="secondary" onClick={() => onOpen()}>Add</Button>
        </Wrapper>
    )
}

export function Admin() {
    const [session, setSession] = useState<Session | null | undefined>(undefined)
    const [allowed, setAllowed] = useState<boolean | null>(null)
    const [place, setPlace] = useState<Place>({ kind: 'singleton', name: MODEL.singletons[0]?.name ?? 'site' })
    const [locale, setLocale] = useState(MAIN_LOCALE)

    useEffect(() => {
        if (!configured()) return
        supabase().auth.getSession().then(({ data }) => setSession(data.session))
        const { data } = supabase().auth.onAuthStateChange((_, s) => setSession(s))
        return () => data.subscription.unsubscribe()
    }, [])
    useEffect(() => {
        if (!session) return setAllowed(null)
        supabase().from('cms_admins').select('user_id').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setAllowed(Boolean(data)))
    }, [session])

    if (!configured()) {
        return (
            <Wrapper direction="column" gap={4} padding={8}>
                <Text as="h1" scale="display-md">This site has no database yet</Text>
                <Text as="p" scale="body">Its content is in the content/ folder of its repository. Once it has its own Supabase database, this is where it is edited.</Text>
            </Wrapper>
        )
    }
    if (session === undefined) return null
    if (!session) return <SignIn />
    if (allowed === false) return <Wrapper padding={8}><Text as="p" scale="body">This account may not edit this site.</Text></Wrapper>
    if (allowed === null) return null

    const panel = (
        <Shell.Panel>
            {MODEL.singletons.map((s) => (
                <Shell.PanelLink key={s.name} href="#" icon={<Icon name="article" />} current={place.kind === 'singleton' && place.name === s.name}
                    onClick={(e) => { e.preventDefault(); setPlace({ kind: 'singleton', name: s.name }) }}>{s.label}</Shell.PanelLink>
            ))}
            {MODEL.collections.map((c) => (
                <Shell.PanelLink key={c.name} href="#" icon={<Icon name="collections_bookmark" />} current={place.kind === 'item' && place.name === c.name}
                    onClick={(e) => { e.preventDefault(); setPlace({ kind: 'item', name: c.name }) }}>{c.label}</Shell.PanelLink>
            ))}
        </Shell.Panel>
    )
    const title = place.kind === 'singleton' ? singletonOf(place.name).label : collectionOf(place.name).label
    return (
        <Shell brand={<Text as="span" scale="heading-sm">Admin</Text>} panel={panel}
            header={
                <Shell.Header>
                    <Wrapper direction="row" gap={3} align="middle-left">
                        {LOCALES.length > 1 && LOCALES.map((l) => (
                            <Button key={l} size="sm" variant={l === locale ? 'primary' : 'tertiary'} onClick={() => setLocale(l)}>{l.toUpperCase()}</Button>
                        ))}
                        <Button size="sm" variant="tertiary" iconStart="logout" onClick={() => supabase().auth.signOut()}>Sign out</Button>
                    </Wrapper>
                </Shell.Header>
            }>
            <Wrapper direction="column" gap={8} padding={8}>
                <Text as="h1" scale="display-md">{title}</Text>
                {place.kind === 'item' && place.slug === undefined
                    ? <Items name={place.name} locale={locale} onOpen={(slug) => setPlace({ kind: 'item', name: place.name, slug: slug ?? '' })} />
                    : <Editor place={place} locale={locale} session={session}
                        onSaved={() => place.kind === 'item' && setPlace({ kind: 'item', name: place.name })} />}
            </Wrapper>
        </Shell>
    )
}
