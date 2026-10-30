// Screenshot every screen at phone and desktop width, light and dark, into docs/screenshots/.
// Usage: start the backend (uvicorn on :8000), then `npm run screenshots [base-url]`.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:8000/"; // landing page URL, ending in /
const OUT = new URL("../../docs/screenshots/", import.meta.url).pathname;
const WIDTHS = [
  { name: "390", viewport: { width: 390, height: 844 } },
  { name: "1280", viewport: { width: 1280, height: 900 } },
];
const THEMES = ["light", "dark"];

async function checkOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) console.warn(`  ! ${label}: horizontal overflow ${overflow}px`);
}

async function shot(page, file) {
  await page.waitForTimeout(250);
  await checkOverflow(page, file);
  await page.screenshot({ path: `${OUT}${file}.png`, fullPage: true });
  console.log(`  ${file}.png`);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const { name, viewport } of WIDTHS) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport,
      colorScheme: theme,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    const tag = `${name}-${theme}`;

    await page.goto(BASE);
    await page.getByRole("link", { name: "Build my week" }).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await shot(page, `0-landing-${tag}`);

    await page.getByRole("link", { name: "Build my week" }).first().click();
    await page.getByRole("button", { name: "Build my week" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await shot(page, `1-onboarding-${tag}`);

    await page.getByRole("button", { name: "Build my week" }).click();
    await page.getByRole("heading", { name: "This week's money" }).waitFor();
    await shot(page, `2-money-${tag}`);

    await page.getByRole("button", { name: "I didn't plan" }).click();
    await page.getByRole("button", { name: "Cook this instead" }).first().waitFor();
    await shot(page, `3-quick-meal-${tag}`);
    await page.getByRole("button", { name: "Cook this instead" }).first().click();

    await page.getByRole("button", { name: /Finish week 1/ }).click();
    await shot(page, `2b-money-banked-${tag}`);

    await page.getByRole("navigation").getByRole("button", { name: "Plan" }).click();
    await page.getByRole("heading", { name: /21 meals/ }).waitFor();
    await shot(page, `4-plan-${tag}`);

    await page.getByRole("navigation").getByRole("button", { name: "Cart" }).click();
    await page.getByRole("button", { name: /Send cart to/ }).waitFor();
    await shot(page, `5-cart-${tag}`);

    await page.getByRole("navigation").getByRole("button", { name: "Goals" }).click();
    await page.getByRole("heading", { name: "What your savings are for" }).waitFor();
    await shot(page, `6-goals-${tag}`);

    if (errors.length) console.warn(`  ! console errors (${tag}):`, errors);
    await context.close();
  }
}
await browser.close();
