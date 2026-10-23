'use client'
// The bar. A client component because Navbar keeps its open state and reads the scroll; everything around
// it stays on the server. Its links come from the `site` singleton's navigation.
import { Navbar } from '@newtone-dev/ui-react-web/navbar'
import { usePathname } from 'next/navigation'

export interface MastheadProps {
    name: string
    home: string
    links: { label: string; href: string }[]
    menu: string
}

export function Masthead({ name, home, links, menu }: MastheadProps) {
    const path = usePathname()
    return (
        <Navbar size="md" maxInlineSize="site">
            <Navbar.Brand href={home} aria-label={`${name}, home`}>
                {name}
            </Navbar.Brand>
            {links.length > 0 && (
                <Navbar.Links>
                    {links.map((link) => (
                        <Navbar.Link key={link.href} href={link.href} current={path === link.href || path.startsWith(`${link.href}/`)}>
                            {link.label}
                        </Navbar.Link>
                    ))}
                </Navbar.Links>
            )}
            {links.length > 0 && <Navbar.MenuButton>{menu}</Navbar.MenuButton>}
        </Navbar>
    )
}
