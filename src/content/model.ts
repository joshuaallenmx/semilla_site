// The site's content model: its languages, its single pages of content (singletons) and its repeating
// content (collections). model.json is the one place it is written; the admin, both content sources and
// the loader all read it, so adding a field there is the whole change.
import model from './model.json'

export type FieldType =
    | 'text' // one line
    | 'long_text' // paragraphs, plain
    | 'email'
    | 'url'
    | 'date' // YYYY-MM-DD
    | 'image' // a URL, uploaded through the admin or given
    | 'links' // [{ label, href }]
    | 'link_groups' // [{ title, links: [{ label, href }] }]
    | 'list' // [string]

export interface Field {
    name: string
    label: string
    type: FieldType
    hint?: string
}

export interface Singleton {
    name: string
    label: string
    fields: Field[]
}

export interface Collection {
    name: string
    label: string
    fields: Field[]
}

export interface Model {
    locales: string[]
    singletons: Singleton[]
    collections: Collection[]
}

export const MODEL = model as Model
export const LOCALES = MODEL.locales
export const MAIN_LOCALE = LOCALES[0]

export type Data = Record<string, unknown>

export interface Item {
    slug: string
    position: number
    data: Data
}

// A path in a language: the main one has no prefix.
export const localized = (path: string, locale: string) =>
    locale === MAIN_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`
