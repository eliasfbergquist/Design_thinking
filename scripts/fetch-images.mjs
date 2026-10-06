import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'food')
await mkdir(outDir, { recursive: true })

const photos = {
  'carbonara.jpg': 'photo-1612874742237-6526221588e3',
  'carbonara-peas.jpg': 'photo-1621996346565-e3dbc646d9a9',
  'beef-tacos.jpg': 'photo-1565299585323-38d6b0865b47',
  'bean-tacos.jpg': 'photo-1552332386-f8dd00dc2f85',
  'chicken-tikka.jpg': 'photo-1565557623262-b51c2513a641',
  'chickpea-tikka.jpg': 'photo-1585937421612-70a008356fbe',
  'smash-burger.jpg': 'photo-1568901346375-23c9450c58cd',
  'halloumi-burger.jpg': 'photo-1550317138-10000687a72b',
  'beef-chili.jpg': 'photo-1617093727343-374698b1b08d',
  'veggie-chili.jpg': 'photo-1547592166-23ac45744acd',
  'tomato-spaghetti.jpg': 'photo-1551183053-bf91a1d81141',
  'shakshuka.jpg': 'photo-1590412200988-a436970781fa',
  'noodle-stirfry.jpg': 'photo-1512058564366-18510be2db19',
  'salmon-dill.jpg': 'photo-1467003909585-2f8a72700288',
  'thai-curry.jpg': 'photo-1455619452474-d2be8b1e70cd',
  'lentil-dal.jpg': 'photo-1546833999-b9f581a1996d',
  'mushroom-risotto.jpg': 'photo-1476124369491-e7addf5db371',
  'fried-rice.jpg': 'photo-1603133872878-684f208fb84b',
  'fish-tacos.jpg': 'photo-1551504734-5ee1c4a1479b',
  'pesto-pasta.jpg': 'photo-1473093295043-cdd812d0e601',
}

let failed = 0
for (const [file, id] of Object.entries(photos)) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=75`
  const res = await fetch(url, { headers: { 'User-Agent': 'SupperPrototype/0.1' }, redirect: 'follow' })
  const type = res.headers.get('content-type') || ''
  if (!res.ok || !type.includes('image')) {
    console.error('FAIL', file, res.status, type)
    failed += 1
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 8000) {
    console.error('SMALL', file, buf.length)
    failed += 1
    continue
  }
  await writeFile(join(outDir, file), buf)
  console.log('ok', file, buf.length)
}
if (failed) {
  console.error(`${failed} images failed`)
  process.exitCode = 1
}
