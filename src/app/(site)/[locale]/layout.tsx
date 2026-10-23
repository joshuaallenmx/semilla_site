// The frame every page sits in: the language, the stylesheets, Newtone's Site with the bar and the footer.
// Pages are app/(site)/[locale]/**/page.tsx and are written by semilla's builder, assembled the way
// Newtone's assembling-a-site.md says, with every word read from the content source.
//
// The import order matters: fonts.css first (the only sheet with an @import url), then the generated
// tokens, then the component sheets. Every component a page renders needs its sheet here; one missing
// renders with no error and no ground.
import '../../../tokens/fonts.css'
import '../../../tokens/newtone.css'
import '@newtone-dev/ui-react-web/avatar.css'
import '@newtone-dev/ui-react-web/button.css'
import '@newtone-dev/ui-react-web/card-box.css'
import '@newtone-dev/ui-react-web/icon.css'
import '@newtone-dev/ui-react-web/link.css'
import '@newtone-dev/ui-react-web/site.css'
import '@newtone-dev/ui-react-web/navbar.css'
import '@newtone-dev/ui-react-web/text.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { Site } from '@newtone-dev/ui-react-web/site'
import { LOCALES, localized } from '../../../content/model'
import { singleton } from '../../../content/source'
import { Footer, Masthead } from '../../../frame'

type Links = { label: string; href: string }[]
type Groups = { title: string; links: Links }[]

export const dynamicParams = false
export const revalidate = 60
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }))

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const site = await singleton('site', (await params).locale)
    return { title: { default: String(site.name ?? ''), template: `%s · ${site.name ?? ''}` }, description: String(site.description ?? '') }
}

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!LOCALES.includes(locale)) notFound()
    const site = await singleton('site', locale)
    const name = String(site.name ?? '')
    const home = localized('/', locale)
    const nav = ((site.navigation as Links) ?? []).map((l) => ({ ...l, href: l.href.startsWith('/') ? localized(l.href, locale) : l.href }))
    return (
        // The mode is art direction, chosen in the markup so the first paint is already right.
        <html lang={locale} data-newtone-mode="light">
            <body data-newtone-surface>
                <Site
                    maxInlineSize="110rem"
                    navbar={<Masthead name={name} home={home} links={nav} menu="Menu" />}
                    footer={<Footer name={name} home={home} email={site.contact_email as string | undefined} groups={(site.footer as Groups) ?? []} />}
                    footerElevation="deep"
                >
                    {children}
                </Site>
            </body>
        </html>
    )
}
