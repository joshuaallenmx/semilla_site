// The main language is served without a prefix (/work), every other one under its tag (/es/work). Pages live
// under app/(site)/[locale]/, so a path without a language is rewritten to the main one before routing.
import { readFileSync } from 'node:fs'

const { locales } = JSON.parse(readFileSync(new URL('./src/content/model.json', import.meta.url), 'utf8'))
const [main] = locales
// Paths already in a language (the main one included, or a rewritten path would be rewritten again) and
// Next's and the site's own routes.
const skip = ['_next', 'admin', 'api', ...locales].join('|')

export default {
    // Next writes AGENTS.md and CLAUDE.md into the repo unless told not to; the site's rules are in README.md.
    agentRules: false,
    // Pages read content/ from disk when the site has no database (previews, and sites not moved yet); a path
    // built at runtime is not traced, so the files are included in every server bundle by name.
    outputFileTracingIncludes: { '/**': ['./content/**/*'] },
    async rewrites() {
        return {
            beforeFiles: [
                { source: '/', destination: `/${main}` },
                // Files in public/ (anything with an extension) are served as they are.
                { source: `/:path((?!(?:${skip})(?:/|$))(?!.*\\.[a-z0-9]+$).*)`, destination: `/${main}/:path` },
            ],
        }
    },
}
