// The closing card: the last band of a page that asks the reader for something, saying how to reach the
// owner. Its shape is assembling-a-site.md §5, corners included; its words are the site's.
import { CardBox } from '@newtone-dev/ui-react-web/card-box'
import { Link } from '@newtone-dev/ui-react-web/link'
import { Site } from '@newtone-dev/ui-react-web/site'
import { Text } from '@newtone-dev/ui-react-web/text'

export function ClosingCard({ title, email }: { title: string; email: string }) {
    return (
        <Site.Band gap={4}>
            <CardBox theme="emphasis" outlined={false} size="lg" direction="column" gap={4} className="newtone-site-tight">
                <Text as="h2" scale="heading-lg">{title}</Text>
                <Text as="p" scale="body"><Link href={`mailto:${email}`}>{email}</Link></Text>
            </CardBox>
        </Site.Band>
    )
}
