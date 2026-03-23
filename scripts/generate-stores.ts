import * as child_process from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const BSR_MODULE = 'buf.build/gkwa/heatedhornet'
const PROTO_PATH = 'stores/v1/stores.proto'
const OUT_PATH = path.resolve('src', 'generated', 'stores.ts')

function toFrontmatterKey(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/, '')
}

function extractDisplayNames(proto: string): string[] {
  const names: string[] = []
  for (const match of proto.matchAll(/\(display_name\)\s*=\s*"([^"]+)"/g)) {
    names.push(match[1])
  }
  return names
}

function renderStoresTs(displayNames: string[], keys: string[]): string {
  const displayNameEntries = keys.map((k, i) => `  "${k}": "${displayNames[i]}",`)
  const lines = [
    '// AUTO-GENERATED — do not edit',
    `// Source: ${BSR_MODULE}`,
    '',
    'export const STORE_KEYS = [',
    ...keys.map((k) => `  "${k}",`),
    '] as const',
    '',
    'export type StoreKey = typeof STORE_KEYS[number]',
    '',
    'export const STORE_DISPLAY_NAMES: Record<StoreKey, string> = {',
    ...displayNameEntries,
    '}',
    '',
  ]
  return lines.join('\n')
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heatedhornet-'))

try {
  child_process.execSync(`buf export ${BSR_MODULE} --output ${tmpDir}`, {
    stdio: 'inherit',
  })

  const proto = fs.readFileSync(path.join(tmpDir, PROTO_PATH), 'utf-8')
  const displayNames = extractDisplayNames(proto)
  const keys = displayNames.map(toFrontmatterKey)

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, renderStoresTs(displayNames, keys))

  process.stderr.write(`Generated ${keys.length} store keys -> ${OUT_PATH}\n`)
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
