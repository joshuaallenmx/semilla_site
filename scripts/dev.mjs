#!/usr/bin/env node
// `next dev`, with the token build re-run whenever src/seed.json changes. The seed is not in Next's module
// graph (the stylesheet it generates is), so without this, editing the seed with a server running silently
// changes nothing. A refused seed is reported here and src/tokens/ keeps its last good build.
import { spawn, execFileSync } from 'node:child_process'
import { watch } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BUILDER = createRequire(import.meta.url).resolve('@newtone-dev/ui-tokens/build.mjs')
const SEED = resolve(here, 'src/seed.json')
// The same arguments as package.json's `tokens` script, so dev and build write the same files.
const ARGS = ['--seed', SEED, '--targets', 'newtone.css,fonts.css', '--out', resolve(here, 'src/tokens'),
    '--icons', `${resolve(here, 'src')},${resolve(here, 'node_modules/@newtone-dev/ui-react-web/dist')}`]

function rebuild() {
    try {
        process.stdout.write(execFileSync(process.execPath, [BUILDER, ...ARGS], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }))
        return true
    } catch (e) {
        console.error('\n  src/seed.json was REFUSED; src/tokens/ still holds the previous build.\n')
        console.error([e.stdout, e.stderr].filter(Boolean).join('').trim() || e.message)
        return false
    }
}

if (!rebuild()) process.exitCode = 1

// An editor's save fires several events, and a seed mid-edit is invalid JSON: rebuild once things settle.
let pending = null
watch(SEED, () => {
    clearTimeout(pending)
    pending = setTimeout(() => { if (rebuild()) console.log('\n  seed changed: tokens rebuilt\n') }, 50)
})

const next = spawn('npx', ['next', 'dev'], { stdio: 'inherit', cwd: here })
next.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => next.kill(sig))
