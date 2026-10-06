import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.SUPPER_URL || 'http://localhost:5173'
await mkdir('shots', { recursive: true })

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})

async function shot(name, hash) {
  await page.goto(`${base}/?shot=${name}${hash}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(350)
  await page.screenshot({ path: `shots/${name}.png` })
  console.log('shot', name, page.url())
}

await shot('01-swipe', '#/swipe')
const today = await page.getAttribute('[data-today]', 'data-today')
await shot('02-plan', '#/plan')
await shot('03-day', `#/day/${today}`)
await page.locator('h2', { hasText: 'Duties' }).scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: 'shots/03b-duties.png' })
await page.getByTestId('choose-meal').click()
await page.waitForTimeout(250)
await page.screenshot({ path: 'shots/04-choose-meal.png' })
await shot('05-recipes', '#/recipes')
await shot('06-recipe', '#/recipe/lentil-dal')
await shot('07-cook-ingredients', `#/cook/lentil-dal?d=${today}`)
await page.getByTestId('mode-steps').click()
await page.waitForTimeout(200)
await page.screenshot({ path: 'shots/08-cook-step.png' })
await page.getByTestId('cook-next').click()
await page.waitForTimeout(200)
await page.screenshot({ path: 'shots/09-cook-step-2.png' })
await shot('10-house', '#/house')
await shot('11-add', '#/add')
await page.goto(`${base}/?shot=who#/swipe`, { waitUntil: 'networkidle' })
await page.getByTestId('who-open').click()
await page.waitForTimeout(250)
await page.screenshot({ path: 'shots/12-who.png' })

const wednesday = await page.evaluate((iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const mondayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayOffset + 2)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}, today)
await shot('13-wednesday', `#/day/${wednesday}`)

const wide = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
await wide.goto(`${base}/?shot=desktop#/plan`, { waitUntil: 'networkidle' })
await wide.evaluate(() => document.fonts.ready)
await wide.waitForTimeout(300)
await wide.screenshot({ path: 'shots/14-desktop-plan.png' })

console.log('errors', errors)
await browser.close()
if (errors.length) process.exitCode = 1
