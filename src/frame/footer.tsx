// The footer, built from Site.Footer's parts as assembling-a-site.md §6 says: the brand and contact, columns
// of links, and the bottom bar. It fills only the slots the `site` singleton has content for.
import { Site } from '@newtone-dev/ui-react-web/site'
import { Text } from '@newtone-dev/ui-react-web/text'

export interface FooterProps {
    name: string
    home: string
    email?: string
    groups: { title: string; links: { label: string; href: string }[] }[]
}

export function Footer({ name, home, email, groups }: FooterProps) {
    return (
        <Site.Footer>
            <Site.FooterBrand href={home} label={name} mark={<Text as="span" scale="heading-sm">{name}</Text>}>
                {email && <Site.FooterLink href={`mailto:${email}`}>{email}</Site.FooterLink>}
            </Site.FooterBrand>
            {groups.map((group) => (
                <Site.FooterColumn key={group.title} title={group.title}>
                    {group.links.map((link) => (
                        <Site.FooterLink key={link.href} href={link.href}>{link.label}</Site.FooterLink>
                    ))}
                </Site.FooterColumn>
            ))}
            <Site.FooterBar copyright={`© ${new Date().getFullYear()} ${name}`} />
        </Site.Footer>
    )
}
