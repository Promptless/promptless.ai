// Start an unconfigured local Astro dev server first. All email APIs below are mocked.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const base = process.env.BINGO_URL || "http://127.0.0.1:4387";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const artifacts = resolve(
  process.env.BINGO_ARTIFACT_DIR || "tmp/bingo-email-evidence",
);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const errors = [];
const navigations = [];
const email = "player@example.test";
let remote = null;
const photos = new Map();
let failCode = true,
  failUpload = true,
  codeRequests = 0;
async function device() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.route("**/*", (route) =>
    route.request().url().startsWith(base) ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });
  return { context, page };
}
async function mockSaving(context) {
  const session = { authenticated: false };
  await context.route("**/bingo-api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/bingo-api/", "");
    const reply = (status, data) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (path === "email/code") {
      codeRequests++;
      assert.equal(request.postDataJSON().email, email);
      return failCode
        ? reply(503, { detail: "Code delivery failed. Please retry." })
        : reply(200, { challenge: "mock-challenge", resendAfter: 0 });
    }
    if (path === "email/verify") {
      if (request.postDataJSON().code !== "123456")
        return reply(400, { detail: "Code invalid or expired." });
      session.authenticated = true;
      return reply(200, { email });
    }
    if (!session.authenticated)
      return reply(401, { detail: "Session expired. Verify again." });
    if (path === "session") return reply(200, { email });
    if (path === "board") {
      if (request.method() === "POST")
        remote = {
          ...request.postDataJSON(),
          publicAlias: "Player ABCDEF1234",
          revision: 0,
          photos: {},
          createdAt: new Date().toISOString(),
        };
      return reply(200, remote);
    }
    if (path.startsWith("board/photos/")) {
      const id = path.split("/").at(-1);
      if (request.method() === "GET")
        return route.fulfill({
          contentType: "image/jpeg",
          body: photos.get(id),
        });
      if (failUpload)
        return reply(503, {
          detail: "Upload failed. Your local board is safe.",
        });
      const bytes = request.postDataBuffer();
      photos.set(id, bytes);
      remote.revision++;
      remote.photos[id] = {
        digest: createHash("sha256").update(bytes).digest("hex"),
        savedAt: new Date().toISOString(),
      };
      return reply(200, remote);
    }
    throw new Error(`Unexpected test route: ${path}`);
  });
  return session;
}
const snapshot = (page) =>
  page.evaluate(async () => {
    const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
    const game = await new LocalBingoStorage().load();
    return {
      token: game.token,
      order: game.order,
      photos: await Promise.all(
        Object.entries(game.photos).map(async ([id, photo]) => [
          id,
          Array.from(new Uint8Array(await photo.blob.arrayBuffer())),
        ]),
      ),
    };
  });
async function shot(page, name) {
  await page.addStyleTag({
    content: "astro-dev-toolbar{display:none!important}",
  });
  await page.screenshot({
    path: resolve(artifacts, `${name}.png`),
    fullPage: true,
  });
}
async function verify(page) {
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify & save" }).click();
}
try {
  const { context, page } = await device();
  await page.goto(`${base}/bingo`);
  await page
    .getByText("Email saving is unavailable", { exact: true })
    .waitFor();
  assert.equal(await page.getByLabel("Your email", { exact: true }).count(), 0);
  await page.locator("button.square").first().click();
  await page.getByLabel("Upload photo", { exact: true }).setInputFiles({
    name: "synthetic.jpg",
    mimeType: "image/jpeg",
    buffer: await sharp({
      create: { width: 100, height: 100, channels: 3, background: "#f0e5c8" },
    })
      .jpeg()
      .toBuffer(),
  });
  await page.getByRole("button", { name: "Save photo & mark square" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  const original = await snapshot(page);
  await page.reload();
  await page
    .getByText("Email saving is unavailable", { exact: true })
    .waitFor();
  assert.deepEqual(await snapshot(page), original);
  await shot(page, "01-unavailable-local-photo-preserved");
  const session = await mockSaving(context);
  await page.getByRole("button", { name: "Retry connection" }).click();
  await page.getByLabel("Your email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Code delivery failed" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Your email", { exact: true }).inputValue(),
    email,
  );
  failCode = false;
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Verify & save" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "invalid or expired" })
    .waitFor();
  failCode = true;
  await page.getByRole("button", { name: "Resend code" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Code delivery failed" })
    .waitFor();
  await verify(page); // A failed resend must retain the earlier usable challenge.
  await page
    .locator("dialog")
    .getByRole("alert")
    .filter({ hasText: "Upload failed" })
    .waitFor();
  assert.equal(
    await page.getByText("Saved across devices", { exact: true }).count(),
    0,
  );
  assert.deepEqual(await snapshot(page), original);
  await shot(page, "02-verified-upload-failure");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    audit.violations.map((v) => v.id),
    [],
  );
  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  await page.getByRole("button", { name: "Retry saving" }).click();
  failUpload = false;
  await page.getByRole("button", { name: "Save or restore my board" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  await page.getByText("Saved across devices", { exact: true }).waitFor();
  await page
    .getByRole("link", { name: "Provisional leaderboard: Player ABCDEF1234" })
    .waitFor();
  assert.deepEqual(await snapshot(page), original);
  assert.equal(photos.size, 1);
  await shot(page, "03-retry-saved");
  session.authenticated = false;
  await page.getByRole("button", { name: "Manage saving" }).click();
  await page.getByRole("button", { name: "Save or restore my board" }).click();
  await page.getByRole("button", { name: "Email me a code" }).waitFor();
  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  failCode = false;
  const before = codeRequests;
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByLabel("Verification code").waitFor();
  assert.equal(
    codeRequests,
    before + 1,
    "A consumed challenge must not reopen after session expiry",
  );
  await verify(page);
  await page.waitForSelector("dialog", { state: "detached" });
  assert.deepEqual(await snapshot(page), original);
  const second = await device();
  await mockSaving(second.context);
  await second.page.goto(`${base}/bingo`);
  await second.page.getByLabel("Your email", { exact: true }).fill(email);
  await second.page.getByRole("button", { name: "Save", exact: true }).click();
  await verify(second.page);
  await second.page.waitForSelector("dialog", { state: "detached" });
  await second.page
    .getByText("Saved across devices", { exact: true })
    .waitFor();
  assert.deepEqual(
    await snapshot(second.page),
    original,
    "Second device restores board and every photo after verification",
  );
  await second.page
    .getByRole("link", { name: "Provisional leaderboard: Player ABCDEF1234" })
    .waitFor();
  assert.deepEqual(errors, []);
  assert.ok(navigations.length > 0);
  assert.ok(navigations.every((url) => url === `${base}/bingo`));
  await writeFile(
    resolve(artifacts, "results.json"),
    JSON.stringify(
      {
        passed: [
          "unconfigured service preserves local photos through reload",
          "connection and email-delivery retry",
          "invalid/expired code and failed resend",
          "failed initial upload remains visible and retry succeeds",
          "session expiry requests a new challenge",
          "verified second-device restore",
          "email verification keeps both devices on the Bingo page",
          "error-dialog accessibility",
        ],
        errors,
        navigations,
      },
      null,
      2,
    ),
  );
  console.log("Email-save browser regressions passed; no live email was sent.");
} catch (error) {
  for (const [index, context] of browser.contexts().entries()) {
    const page = context.pages()[0];
    if (page) {
      await shot(page, `failure-${index}`).catch(() => {});
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
