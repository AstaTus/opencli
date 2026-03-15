import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apis: string[] = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('subtitle') || url.includes('player/v2') || url.includes('x/player/wbi/v2')) {
        console.log("Found subtitle API candidate:", url);
    }
  });

  console.log("Navigating to video...");
  await page.goto('https://www.bilibili.com/video/BV1K3411r7F9');
  await page.waitForTimeout(5000);
  
  // Try to find subtitle info in __INITIAL_STATE__
  const initialState = await page.evaluate(() => {
    return (window as any).__INITIAL_STATE__;
  });
  
  if (initialState) {
    console.log("Found __INITIAL_STATE__ exists!");
    // check if there's bvid or aid
    console.log("BVID:", initialState.bvid);
    console.log("AID:", initialState.aid);
  }

  await browser.close();
}
main();
