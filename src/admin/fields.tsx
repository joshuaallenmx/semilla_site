'use client'
// One editor per field type. Newtone's fields are uncontrolled, so each editor names its inputs and
// `read` turns the submitted form back into the field's value.
import { useState } from 'react'
import { Button } from '@newtone-dev/ui-react-web/button'
import { FileField } from '@newtone-dev/ui-react-web/file-field'
import { TextField } from '@newtone-dev/ui-react-web/text-field'
import { Text } from '@newtone-dev/ui-react-web/text'
import { Wrapper } from '@newtone-dev/ui-react-web/wrapper'
import type { Field } from '../content/model'
import { supabase } from './client'

type Link = { label: string; href: string }
type Group = { title: string; links: Link[] }

let next = 0
const keyed = <T,>(rows: T[]) => rows.map((row) => ({ key: next++, row }))

function LinkRows({ name, initial }: { name: string; initial: Link[] }) {
    const [rows, setRows] = useState(() => keyed(initial))
    return (
        <Wrapper direction="column" gap={3}>
            {rows.map(({ key, row }, i) => (
                <Wrapper key={key} direction="row" gap={3} align="bottom-left" wrap>
                    <TextField label="Label" name={`${name}.${i}.label`} defaultValue={row.label} />
                    <TextField label="Link" name={`${name}.${i}.href`} defaultValue={row.href} />
                    <Button type="button" variant="tertiary" size="sm" onClick={() => setRows(rows.filter((r) => r.key !== key))}>Remove</Button>
                </Wrapper>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setRows([...rows, ...keyed([{ label: '', href: '' }])])}>Add a link</Button>
        </Wrapper>
    )
}

function GroupRows({ name, initial }: { name: string; initial: Group[] }) {
    const [rows, setRows] = useState(() => keyed(initial))
    return (
        <Wrapper direction="column" gap={5}>
            {rows.map(({ key, row }, i) => (
                <Wrapper key={key} direction="column" gap={3}>
                    <Wrapper direction="row" gap={3} align="bottom-left">
                        <TextField label="Column title" name={`${name}.${i}.title`} defaultValue={row.title} />
                        <Button type="button" variant="tertiary" size="sm" onClick={() => setRows(rows.filter((r) => r.key !== key))}>Remove column</Button>
                    </Wrapper>
                    <LinkRows name={`${name}.${i}.links`} initial={row.links ?? []} />
                </Wrapper>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setRows([...rows, ...keyed([{ title: '', links: [] }])])}>Add a column</Button>
        </Wrapper>
    )
}

function ImageField({ field, value }: { field: Field; value: string }) {
    const [url, setUrl] = useState(value)
    const [state, setState] = useState('')
    async function upload(file: File) {
        setState('Uploading…')
        const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()}`
        const { error } = await supabase().storage.from('media').upload(path, file)
        if (error) return setState('The upload failed.')
        setUrl(supabase().storage.from('media').getPublicUrl(path).data.publicUrl)
        setState('')
    }
    return (
        <Wrapper direction="column" gap={3}>
            {/* Keyed by the URL so an upload replaces what the field shows. */}
            <TextField key={url} label={field.label} name={field.name} hint={field.hint} type="url" defaultValue={url} />
            <FileField label="Upload an image" name={`${field.name}.__file`} accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {state && <Text as="p" scale="caption">{state}</Text>}
        </Wrapper>
    )
}

export function FieldEditor({ field, value }: { field: Field; value: unknown }) {
    const { name, label, hint } = field
    switch (field.type) {
        case 'long_text':
            return <TextField multiline label={label} name={name} hint={hint} rows={5} defaultValue={String(value ?? '')} />
        case 'list':
            return <TextField multiline label={label} name={name} hint={hint ?? 'One per line.'} rows={4} defaultValue={((value as string[]) ?? []).join('\n')} />
        case 'links':
            return (
                <Wrapper direction="column" gap={3}>
                    <Text as="p" scale="heading-sm">{label}</Text>
                    {hint && <Text as="p" scale="caption">{hint}</Text>}
                    <LinkRows name={name} initial={(value as Link[]) ?? []} />
                </Wrapper>
            )
        case 'link_groups':
            return (
                <Wrapper direction="column" gap={3}>
                    <Text as="p" scale="heading-sm">{label}</Text>
                    {hint && <Text as="p" scale="caption">{hint}</Text>}
                    <GroupRows name={name} initial={(value as Group[]) ?? []} />
                </Wrapper>
            )
        case 'image':
            return <ImageField field={field} value={String(value ?? '')} />
        default:
            return <TextField label={label} name={name} hint={hint} type={field.type === 'text' ? 'text' : field.type} defaultValue={String(value ?? '')} />
    }
}

// Rows named `a.0.b` back into [index, { b }], in order. Removed rows leave gaps in the indexes, so a row's
// own rows (a group's links) are found by its index, not its position.
function rowsOf(form: FormData, prefix: string): [number, Record<string, string>][] {
    const rows = new Map<number, Record<string, string>>()
    for (const [key, value] of form.entries()) {
        if (!key.startsWith(`${prefix}.`)) continue
        const m = key.slice(prefix.length).match(/^\.(\d+)\.([a-z_]+)$/)
        if (!m) continue
        const i = Number(m[1])
        if (!rows.has(i)) rows.set(i, {})
        rows.get(i)![m[2]] = String(value).trim()
    }
    return [...rows.entries()].sort(([a], [b]) => a - b)
}

const links = (form: FormData, prefix: string) =>
    rowsOf(form, prefix).map(([, l]) => ({ label: l.label ?? '', href: l.href ?? '' })).filter((l) => l.label || l.href)

export function read(form: FormData, field: Field): unknown {
    switch (field.type) {
        case 'list':
            return String(form.get(field.name) ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
        case 'links':
            return links(form, field.name)
        case 'link_groups':
            return rowsOf(form, field.name)
                .map(([i, g]) => ({ title: g.title ?? '', links: links(form, `${field.name}.${i}.links`) }))
                .filter((g) => g.title || g.links.length)
        default:
            return String(form.get(field.name) ?? '').trim()
    }
}
