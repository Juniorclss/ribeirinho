const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('Title page loaded');

  // Click start new game
  const startBtn = await page.waitForSelector('[data-testid="start-new-game-btn"]');
  await startBtn.click();

  // Wait for game viewport and cutscene or gameplay
  await page.waitForSelector('[data-testid="game-viewport"]');
  await page.waitForTimeout(2000);

  // Take screenshot during intro/gameplay
  await page.screenshot({ path: '/tmp/gameplay_intro.png' });
  console.log('Screenshot saved: /tmp/gameplay_intro.png');

  // Skip cutscene if banner present
  const skipBtn = await page.$('[data-testid="skip-cutscene-btn"]');
  if (skipBtn) {
    await skipBtn.click();
    await page.waitForTimeout(1500);
  }

  // Click on the ground to move
  await page.mouse.click(640, 450);
  await page.waitForTimeout(1000);

  // Take screenshot of free gameplay with mouse controls
  await page.screenshot({ path: '/tmp/gameplay_freemove.png' });
  console.log('Screenshot saved: /tmp/gameplay_freemove.png');

  console.log('Console errors:', errors.length, errors);
  await browser.close();
})();
