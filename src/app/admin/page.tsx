// The owner's admin, once the site has its own database. A site without one (no collection yet: a one-pager) is
// edited through semilla and lives on its content files, so /admin is not there.
import { notFound } from 'next/navigation'
import { Admin } from '../../admin/admin'
import { usesDatabase } from '../../content/source'

export default function AdminPage() {
    if (!usesDatabase()) notFound()
    return <Admin />
}
