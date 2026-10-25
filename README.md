# A semilla site

A person's website, made with semilla: Next.js, on Newtone, with its content in a CMS. **It belongs to its
owner**: their repository, their database, their hosting. It runs without semilla.

- `npm run dev` serves it (and rebuilds the tokens when `src/seed.json` changes); `npm run build` builds it.
- `/admin` is where the owner edits the content, once the site has its own database. Without one, `/admin` is not there (not found), and nothing links to it.

## How it is put together

- **Design: Newtone.** `@newtone-dev/ui-react-web` for the parts, `@newtone-dev/ui-tokens` for the tokens.
  `src/seed.json` is the site's art direction (hues, saturations, faces); `npm run tokens` turns it into
  `src/tokens/`. No color, size or face is written anywhere else.
- **Pages** are `src/app/(site)/[locale]/**/page.tsx`, assembled exactly as Newtone's
  `ui_react-web/_blueprint/assembling-a-site.md` says: page kinds (home, inner, reading), the heading ladder,
  band rhythm from `Site.Band`'s props, widths, the closing card (`src/frame/closing-card.tsx`) on every page
  that asks the reader for something, the footer. A better way found while building a site goes into that
  spec or into Newtone, never only here.
- **Stylesheets**: every component a page renders has its sheet imported in
  `src/app/(site)/[locale]/layout.tsx`, in the order there. A missing sheet renders with no error and no ground.
- **The frame** (`src/frame/`): the bar and the footer, filled from the `site` singleton.
- **Words are never in the code.** Every word a visitor reads comes from the content source
  (`src/content/source.ts`): `singleton(name, locale)`, `items(collection, locale)`, `item(collection, slug,
  locale)`. A page reads its content and lays it out; changing what the site says never needs a deploy.

## Content

`src/content/model.json` is the content model: the languages (the first is the main one, served without a
prefix; the others under `/<tag>/`), the singletons (one-off content: the site itself, the about page) and the
collections (repeating content: works, entries), each with typed fields (`text`, `long_text`, `email`, `url`,
`date`, `image`, `links`, `link_groups`, `list`). The admin, both sources and the loader all read it.

Two sources, one model:

- **The owner's Supabase database** (`src/content/database.ts`, schema in `supabase/migrations/`), when
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set: in production only. Edited in
  `/admin`. Previews have neither, so a branch's preview shows the content files of that branch: a change is seen
  before it is published, and never live before.
- **Files** (`content/<locale>/<singleton>.json`, `content/<locale>/<collection>/<slug>.json` with a `position`)
  otherwise: for a site that does not have its own database yet. Moving to one is
  `npm run load-content -- --admin <owner's email>` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`,
  then setting the two public variables.

A missing translation falls back to the main language.
