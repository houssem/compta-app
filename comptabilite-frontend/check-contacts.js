const puppeteer = require('puppeteer')

const CLIENT_ID = '009a29aa-efd7-40c7-b918-b6001b0c256f'
const BASE_URL  = 'http://localhost:4200'

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('console', m => console.log('[browser]', m.text()))

  // ── Login ────────────────────────────────────────────────────
  console.log('Navigating to login…')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' })

  await page.type('#email', 'houssem.kallel@gmail.com')
  await page.type('#password', 'Test@123')
  await page.click('button[type="submit"]')

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
  console.log('After login URL:', page.url())

  // ── Edit client page ─────────────────────────────────────────
  console.log('Navigating to edit client…')
  await page.goto(`${BASE_URL}/client/edit/${CLIENT_ID}`, { waitUntil: 'networkidle2' })

  // Wait for at least one contact card to appear
  await page.waitForSelector('.nc-contact-card', { timeout: 10000 })
  // Extra wait for async data patch
  await new Promise(r => setTimeout(r, 1500))

  // ── Read all contact cards ───────────────────────────────────
  const contacts = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.nc-contact-card'))
    return cards.map((card, i) => {
      const inputs = card.querySelectorAll('input')
      const get = (idx) => inputs[idx]?.value ?? '(no input)'
      return {
        index:    i + 1,
        fullName: get(0),
        role:     get(1),
        email:    get(2),
        phone:    get(3),
      }
    })
  })

  console.log(`\nFound ${contacts.length} contact card(s):\n`)
  contacts.forEach(c => {
    console.log(`  Contact ${c.index}:`)
    console.log(`    fullName : "${c.fullName}"`)
    console.log(`    role     : "${c.role}"`)
    console.log(`    email    : "${c.email}"`)
    console.log(`    phone    : "${c.phone}"`)
  })

  await browser.close()
})()
