// Post-build: stamp the bundle version into dist/version.json (read by the app
// over the network to detect updates even when the cached shell is stale) and
// sync the service-worker cache name to the app version.
import { readFileSync, writeFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const m = app.match(/APP_VERSION = '([^']+)'/)
const version = m ? m[1] : '0.0.0'

writeFileSync('dist/version.json', JSON.stringify({ v: version, built: new Date().toISOString() }))

let sw = readFileSync('dist/sw.js', 'utf8')
sw = sw.replace(/const CACHE = 'jwtalk-v[^']*'/, `const CACHE = 'jwtalk-v${version}'`)
writeFileSync('dist/sw.js', sw)

console.log('version.json stamped:', version)
