// The admin is an app, so it is framed by Newtone's Shell rather than Site, and it is its own root layout.
import '../../tokens/fonts.css'
import '../../tokens/newtone.css'
import '@newtone-dev/ui-react-web/button.css'
import '@newtone-dev/ui-react-web/file-field.css'
import '@newtone-dev/ui-react-web/icon.css'
import '@newtone-dev/ui-react-web/shell.css'
import '@newtone-dev/ui-react-web/text-field.css'
import '@newtone-dev/ui-react-web/text.css'

import type { ReactNode } from 'react'

export const metadata = { title: 'Admin', description: 'Where the owner edits this site.', robots: { index: false } }

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" data-newtone-mode="light">
            <body data-newtone-surface>{children}</body>
        </html>
    )
}
