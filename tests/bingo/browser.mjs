// Start `npm run dev -- --host 127.0.0.1 --port 4387` first.
// Uses a fresh, isolated browser profile; never reads a personal Chrome profile.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const base = process.env.BINGO_URL || "http://127.0.0.1:4387";
const artifacts = resolve(
  process.env.BINGO_ARTIFACT_DIR || "tmp/bingo-evidence",
);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const failures = [];
page.on("pageerror", (error) => failures.push(error.message));
const externalRequests = [];
await context.route("**/*", (route) => {
  const url = route.request().url();
  if (
    !url.startsWith(base) &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:")
  ) {
    externalRequests.push(url);
    return route.abort();
  }
  return route.continue();
});
const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#f7f1df"/><text x="80" y="130" font-size="28" font-family="sans-serif" fill="#514757">SYNTHETIC TEST FIXTURE · NOT A REAL SUBMISSION</text><text x="80" y="350" font-size="80" font-family="sans-serif" fill="#282334">Great question!</text><text x="80" y="470" font-size="35" font-family="sans-serif" fill="#514757">What time does it close?</text></svg>',
);
const fixture = await sharp(svg)
  .jpeg()
  .withMetadata({ exif: { IFD0: { Artist: "Bingo metadata test" } } })
  .toBuffer();
const fixturePath = resolve(artifacts, "synthetic-evidence.jpg");
await writeFile(fixturePath, fixture);
const upload = () => page.locator('input[aria-label="Upload photo"]');
const square = () => page.locator("button.square").first();
const screenshot = async (name) => {
  await page.addStyleTag({
    content: "astro-dev-toolbar { display: none !important; }",
  });
  await page.mouse.move(0, 0);
  return page.screenshot({
    path: resolve(artifacts, `${name}.png`),
    fullPage: true,
  });
};
async function audit(name) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map((node) => node.target),
    })),
    [],
    `${name} accessibility`,
  );
}
async function closePanel() {
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
}
async function openFirst() {
  await square().click();
  await page.waitForSelector("dialog[open]");
}
async function saveFixture() {
  await upload().setInputFiles(fixturePath);
  await page.getByRole("button", { name: "Save photo & mark square" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
}

try {
  await page.goto(`${base}/bingo`);
  await page.waitForSelector("button.square");
  assert.equal(
    await page.locator('input[type="email"]').count(),
    1,
    "Optional inline email save",
  );
  await screenshot("01-mobile-anonymous");
  await page.getByLabel("Your email", { exact: true }).waitFor();
  await audit("Email save form");
  await screenshot("01b-mobile-save-email");
  assert.equal(
    await page.getByRole("button", { name: "Device & privacy" }).count(),
    0,
  );
  await page.waitForSelector("button.square");
  assert.equal(await page.locator(".square").count(), 25);
  assert.equal(await page.locator(".free").count(), 1);
  const order = await page.locator("button.square").allTextContents();
  await screenshot("02-mobile-board");
  await audit("Board");
  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `No overflow at ${width}px`,
    );
    const boxes = await page.locator("button.square").evaluateAll((elements) =>
      elements.map((el) => ({
        w: el.getBoundingClientRect().width,
        h: el.getBoundingClientRect().height,
        clips: el.scrollHeight > el.clientHeight,
      })),
    );
    assert.ok(
      boxes.every((box) => box.w >= 44 && box.h >= 44 && !box.clips),
      `Readable tap targets at ${width}px`,
    );
  }
  await screenshot("03-desktop-board");
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole("button", { name: /^Asyndetic parataxis,/ }).click();
  await page
    .getByText("Short clauses placed side by side", { exact: false })
    .waitFor();
  await screenshot("03b-mobile-parataxis");
  await closePanel();

  await openFirst();
  assert.equal(
    await page.locator("input[capture]").getAttribute("capture"),
    "environment",
  );
  await upload().setInputFiles({
    name: "bad.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("not an image"),
  });
  await page.getByRole("alert").filter({ hasText: "does not look" }).waitFor();
  await upload().setInputFiles({
    name: "large.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(12 * 1024 * 1024 + 1),
  });
  await page.getByRole("alert").filter({ hasText: "under 12 MB" }).waitFor();
  await upload().setInputFiles({
    name: "phone.heic",
    mimeType: "image/heic",
    buffer: Buffer.from("heic"),
  });
  await page.getByRole("alert").filter({ hasText: "For HEIC" }).waitFor();
  await upload().setInputFiles(fixturePath);
  await page.getByText("Preview · not saved yet").waitFor();
  await screenshot("04-mobile-photo-preview");
  await audit("Evidence dialog");
  await page
    .getByRole("button", { name: "Cancel — keep my last saved board" })
    .click();
  assert.equal(await page.locator(".marked").count(), 0);

  // Native picker cancellation, escape, and same-file reselection.
  assert.ok(
    await square().evaluate((element) => element === document.activeElement),
    "Closing a dialog restores focus to its square",
  );
  await openFirst();
  await upload().setInputFiles([]);
  assert.equal(await page.locator(".photo-preview").count(), 0);
  await page.keyboard.press("Escape");
  // Cancel while conversion is still pending: no late result may mark a square.
  await page.evaluate(() => {
    window.bingoOriginalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      window.bingoOriginalToBlob.call(
        this,
        (blob) => setTimeout(() => callback(blob), 400),
        ...args,
      );
    };
  });
  await openFirst();
  await upload().setInputFiles(fixturePath);
  await page
    .getByText("Preparing a private copy… You can cancel below.")
    .waitFor();
  await page
    .getByRole("button", { name: "Cancel — keep my last saved board" })
    .click();
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = window.bingoOriginalToBlob;
  });
  await openFirst();
  await upload().setInputFiles(fixturePath);
  // Repeated taps must produce a single committed revision.
  await page
    .getByRole("button", { name: "Save photo & mark square" })
    .evaluate((button) => {
      button.click();
      button.click();
    });
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await page.locator(".marked").count(), 1);
  await page.reload();
  await page.waitForSelector(".marked");
  assert.deepEqual(
    await page.locator("button.square").allTextContents(),
    order.map((text, index) => (index === 0 ? text.replace("+", "✓") : text)),
  );

  const sanitized = await page.evaluate(async () => {
    const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
    const game = await new LocalBingoStorage().load();
    return Array.from(
      new Uint8Array(await game.photos[game.order[0]].blob.arrayBuffer()),
    );
  });
  const metadata = await sharp(Buffer.from(sanitized)).metadata();
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.xmp, undefined);
  assert.ok(metadata.width <= 1600 && metadata.height <= 1600);

  // Staged replacement must not clobber the committed photo when interrupted.
  await openFirst();
  await upload().setInputFiles(fixturePath);
  await page.getByText("Preview · not saved yet").waitFor();
  await page.reload();
  await page.waitForSelector(".marked");
  assert.equal(await page.locator(".marked").count(), 1);
  await openFirst();
  await saveFixture();
  assert.equal(await page.locator(".marked").count(), 1);
  await context.setOffline(true);
  await openFirst();
  await saveFixture();
  assert.equal(await page.locator(".marked").count(), 1);
  await context.setOffline(false);

  // Inject storage failure at the actual IDB write boundary: prior data survives.
  await page.evaluate(() => {
    window.bingoOriginalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Test quota", "QuotaExceededError");
    };
  });
  await openFirst();
  await upload().setInputFiles(fixturePath);
  await page.getByRole("button", { name: "Save photo & mark square" }).click();
  await page.getByRole("alert").filter({ hasText: "out of storage" }).waitFor();
  await screenshot("05-mobile-save-failure");
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = window.bingoOriginalPut;
  });
  await page.getByRole("button", { name: "Save photo & mark square" }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await page.locator(".marked").count(), 1);

  await openFirst();
  await page.getByRole("button", { name: "Remove saved photo" }).click();
  await page.getByRole("button", { name: "Keep photo" }).click();
  await page.getByRole("button", { name: "Remove saved photo" }).click();
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await page.waitForSelector("dialog", { state: "detached" });
  assert.equal(await page.locator(".marked").count(), 0);

  // Fill a diagonal through the UI, including the free center.
  for (const index of [0, 6, 18, 24]) {
    await page.locator(".square").nth(index).click();
    await saveFixture();
  }
  await page.getByText("✳ BINGO! Nice eye.").waitFor();
  assert.equal(await page.locator(".winner").count(), 4);
  await screenshot("06-mobile-bingo");
  await audit("Success");

  // Simultaneous saves from two tabs must reject the stale revision, not lose data.
  const second = await context.newPage();
  await second.goto(`${base}/bingo`);
  await second.waitForSelector(".marked");
  const conflict = await second.evaluate(async () => {
    const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
    const store = new LocalBingoStorage();
    const old = await store.load();
    const results = await Promise.allSettled([
      store.saveEmail(old, "changed@example.com"),
      store.saveEmail(old, "stale@example.com"),
    ]);
    return results.map((result) => result.status);
  });
  assert.deepEqual(conflict.sort(), ["fulfilled", "rejected"]);
  await second.close();
  await page.reload();
  await page.waitForSelector(".marked");

  // Knowing the same email in a separate browser context reveals nothing.
  const separate = await browser.newContext();
  const other = await separate.newPage();
  await other.goto(`${base}/bingo`);
  await other.waitForSelector("button.square");
  assert.equal(await other.locator(".marked").count(), 0);
  const tokens = await Promise.all(
    [page, other].map((p) =>
      p.evaluate(async () => {
        const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
        return (await new LocalBingoStorage().load()).token;
      }),
    ),
  );
  assert.notEqual(tokens[0], tokens[1]);
  await separate.close();

  // Simulate a previously saved draft edition only in this isolated test profile.
  const earlierPhoto = await page.evaluate(async () => {
    const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
    const { LEGACY_TELLS } = await import("/src/lib/bingo/legacy-patterns.ts");
    const game = await new LocalBingoStorage().load();
    const photo = Object.values(game.photos)[0];
    const order = LEGACY_TELLS.map((tell) => tell.id);
    order.splice(12, 0, "free");
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("promptless-ai-tells-bingo", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("boards", "readwrite");
        tx.objectStore("boards").put(
          { ...game, order, photos: { [order[0]]: photo } },
          "active",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
    return {
      token: game.token,
      bytes: Array.from(new Uint8Array(await photo.blob.arrayBuffer())),
    };
  });
  await page.reload();
  await page
    .getByText("This saved board uses the earlier tell list.", { exact: false })
    .waitFor();
  assert.equal(await page.locator(".marked").count(), 1);
  const restoredPhoto = await page.evaluate(async () => {
    const { LocalBingoStorage } = await import("/src/lib/bingo/storage.ts");
    const game = await new LocalBingoStorage().load();
    return {
      token: game.token,
      bytes: Array.from(
        new Uint8Array(await game.photos["totally-right"].blob.arrayBuffer()),
      ),
    };
  });
  assert.deepEqual(restoredPhoto, earlierPhoto);
  await openFirst();
  await page.getByAltText("Your saved writing example").waitFor();
  await closePanel();

  assert.deepEqual(failures, []);
  assert.deepEqual(externalRequests, []);
  const report = {
    passed: true,
    viewportWidths: [320, 375, 390, 768, 1280],
    accessibilityStates: ["email-save", "board", "evidence", "success"],
    flows: [
      "anonymous play and optional email save",
      "24 randomized squares + free center",
      "asyndetic parataxis hint on mobile",
      "earlier edition preserves photo bytes and identity",
      "capture attribute",
      "bad/oversized/HEIC rejection",
      "preview/cancel",
      "cancel during processing",
      "repeated save taps",
      "picker cancel",
      "same file retry",
      "save/reload",
      "EXIF stripping",
      "interrupted replacement",
      "offline save after load",
      "replace/remove",
      "quota failure/retry",
      "diagonal bingo",
      "concurrent writes",
      "same email in separate browser",
    ],
    realPhoneCamera: "Not exercised; requires physical iOS/Android device",
    externalRequests,
    pageErrors: failures,
  };
  await writeFile(
    resolve(artifacts, "browser-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
