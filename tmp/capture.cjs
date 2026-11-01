const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/title_screen.png' });
  console.log('Title screenshot taken');

  // Try to click Novo Jogo
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await b.textContent();
    if (text && text.includes('Novo Jogo')) {
      await b.click();
      break;
    }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/gameplay_screen.png' });
  console.log('Gameplay screenshot taken');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
