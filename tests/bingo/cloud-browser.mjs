// Run with the guarded runtime.bingo.tests.local_app fake-inbox harness on :5019.
// Real email providers and personal browser profiles are never used.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const base = process.env.BINGO_URL || "http://127.0.0.1:4388";
const harness = "http://127.0.0.1:5019";
const artifacts = resolve(
  process.env.BINGO_ARTIFACT_DIR || "tmp/bingo-cloud-evidence",
);
await mkdir(artifacts, { recursive: true });
const fixture = await sharp({
  create: { width: 800, height: 600, channels: 3, background: "#f0e5c8" },
})
  .jpeg()
  .toBuffer();
const photo = {
  name: "synthetic-evidence.jpg",
  mimeType: "image/jpeg",
  buffer: fixture,
};
const email = `bingo-${Date.now()}@example.test`;
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const errors = [],
  results = [];
async function device() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await context.route("**/*", (route) =>
    route.request().url().startsWith(base) ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/bingo`);
  await page.locator("button.square").first().waitFor();
  return { context, page };
}
const count = (page) =>
  page.locator('button.square[aria-label$="photo saved"]').count();
const board = (page) =>
  page.evaluate(async () => (await fetch("/bingo-api/board")).json());
async function shot(page, name) {
  await page.addStyleTag({
    content: "astro-dev-toolbar { display:none!important }",
  });
  await page.screenshot({
    path: resolve(artifacts, `${name}.png`),
    fullPage: true,
  });
}
async function waitSaved(page) {
  await page.getByText("Saved across devices", { exact: true }).waitFor();
}
async function upload(page, index = 0) {
  await page
    .locator('button.square[aria-label$="add a photo"]')
    .nth(index)
    .click();
  await page.getByLabel("Upload photo", { exact: true }).setInputFiles(photo);
  await page.getByRole("button", { name: "Save photo & mark square" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
}
async function login(page, wrongFirst = false) {
  await page.getByLabel("Your email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByLabel("Verification code").waitFor();
  const inbox = await (await fetch(`${harness}/__test__/inbox`)).json();
  const code = inbox[email];
  assert.match(code, /^\d{6}$/);
  if (wrongFirst) {
    await page.getByRole("button", { name: "Close panel" }).click();
    await page.waitForSelector("dialog", { state: "detached" });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByLabel("Verification code").waitFor();
    await shot(page, "02-code-entry");
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => v.id),
      [],
      "OTP accessibility",
    );
    await page
      .getByLabel("Verification code")
      .fill(code === "000000" ? "000001" : "000000");
    await page.getByRole("button", { name: "Verify & save" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "invalid or expired" })
      .waitFor();
  }
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify & save" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  await waitSaved(page);
}
try {
  const a = await device();
  assert.equal(await a.page.locator('input[type="email"]').count(), 1);
  await upload(a.page);
  await shot(a.page, "01-anonymous-progress");
  await login(a.page, true);
  const savedA = await board(a.page);
  assert.equal(Object.keys(savedA.photos).length, 1);
  const cookie = (await a.context.cookies(`${base}/bingo-api/session`)).find(
    (c) => c.name.includes("bingo"),
  );
  assert.ok(cookie?.httpOnly && cookie.sameSite === "Lax");
  assert.equal(
    (await a.page.evaluate(() => document.cookie)).includes(cookie.name),
    false,
  );
  await shot(a.page, "03-saved-board");
  results.push(
    "Anonymous progress → wrong-code retry → verified private saving; HttpOnly session; accessible mobile OTP",
  );
  console.log(results.at(-1));

  const b = await device();
  assert.equal(await count(b.page), 0);
  const unauthorized = await b.page.evaluate(
    async (email) =>
      (await fetch(`/bingo-api/board?email=${encodeURIComponent(email)}`))
        .status,
    email,
  );
  assert.equal(unauthorized, 401, "Email alone grants no access");
  await fetch(`${harness}/__test__/advance`, { method: "POST" });
  await login(b.page);
  assert.equal(await count(b.page), 1);
  assert.deepEqual((await board(b.page)).order, savedA.order);
  await b.page.reload();
  await waitSaved(b.page);
  assert.equal(await count(b.page), 1);
  results.push(
    "Second isolated device restores board order/photos only after OTP, including reload",
  );
  console.log(results.at(-1));

  await b.context.setOffline(true);
  await upload(b.page);
  assert.equal(await count(b.page), 2);
  await b.context.setOffline(false);
  await waitSaved(b.page);
  assert.equal(Object.keys((await board(b.page)).photos).length, 2);
  results.push(
    "Offline photo is retained locally and synchronized on reconnection",
  );
  console.log(results.at(-1));

  await upload(a.page, 1);
  await a.page.getByRole("button", { name: "Review saved board" }).waitFor();
  assert.equal(await count(a.page), 2, "Stale-device photo stays local");
  await shot(a.page, "04-save-conflict");
  await a.page.getByRole("button", { name: "Review saved board" }).click();
  await a.page
    .getByRole("button", { name: "Save or restore my board" })
    .click();
  await a.page.getByRole("button", { name: "Continue saved board" }).click();
  await a.page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await count(a.page), 2);
  await a.page.getByRole("button", { name: "Manage saving" }).click();
  await a.page
    .getByRole("button", { name: /Restore previous local board/ })
    .click();
  await a.page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await count(a.page), 2);
  assert.equal(
    await a.page.evaluate(
      async () => (await fetch("/bingo-api/session")).status,
    ),
    401,
  );
  results.push(
    "Concurrent device changes cause a reviewable conflict; restoring preserves a recoverable local board; sign-out revokes session",
  );

  let dropped = false;
  await b.context.route("**/bingo-api/board/photos/*", async (route) => {
    if (route.request().method() === "PUT" && !dropped) {
      dropped = true;
      await route.fetch(); // Commit on server, lose the response on purpose.
      await route.abort("failed");
    } else await route.continue();
  });
  await upload(b.page);
  await b.page.getByRole("button", { name: "Retry saving" }).waitFor();
  assert.equal(await count(b.page), 3);
  assert.equal(Object.keys((await board(b.page)).photos).length, 3);
  await b.page.getByRole("button", { name: "Retry saving" }).click();
  await b.page
    .getByRole("button", { name: "Save or restore my board" })
    .click();
  await b.page.getByRole("button", { name: "Continue saved board" }).click();
  await b.page.waitForSelector("dialog", { state: "detached" });
  await waitSaved(b.page);
  assert.equal(await count(b.page), 3);
  results.push(
    "Lost upload response recovers without duplicate photos or progress loss",
  );

  await b.page.getByRole("button", { name: "Manage saving" }).click();
  await b.page.getByRole("button", { name: "Delete saved copy" }).click();
  await b.page
    .getByRole("button", { name: "Delete saved board", exact: true })
    .click();
  await b.page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await count(b.page), 3, "Deleting cloud copy keeps device copy");
  assert.equal(
    await b.page.evaluate(async () => (await fetch("/bingo-api/board")).status),
    401,
  );
  results.push(
    "Explicit saved-board deletion revokes browser session and keeps local evidence",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(artifacts, "results.json"),
    JSON.stringify(
      { passed: results, screenshots: artifacts, errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: results, artifacts }, null, 2));
} catch (error) {
  for (const [i, context] of browser.contexts().entries()) {
    const page = context.pages()[0];
    if (page) {
      await shot(page, `failure-${i}`).catch(() => {});
      console.error(
        await page
          .locator("body")
          .innerText()
          .catch(() => "No page"),
      );
    }
  }
  throw error;
} finally {
  await browser.close();
}
