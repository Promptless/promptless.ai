// All standings below are synthetic fixtures; no production API or email is used.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.BINGO_URL || "http://127.0.0.1:4392";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const artifacts = resolve(
  process.env.BINGO_ARTIFACT_DIR || "tmp/bingo-leaderboard-evidence",
);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const snapshot = {
  status: "provisional",
  updatedAt: "2026-10-26T18:00:00Z",
  entries: [
    { rank: 1, alias: "Player ABCDEF1234", bingoLines: 3, tellsFound: 15 },
    { rank: 1, alias: "Player 123456ABCD", bingoLines: 3, tellsFound: 15 },
    { rank: 3, alias: "Player 987654FEDC", bingoLines: 1, tellsFound: 8 },
    { rank: 4, alias: "Player A1B2C3D4E5", bingoLines: 0, tellsFound: 0 },
  ],
};
const errors = [],
  reports = [];
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: width > 600 ? 1100 : 844 },
    });
    await context.route("**/*", (route) =>
      route.request().url().startsWith(base) ? route.continue() : route.abort(),
    );
    let mode = "scores";
    await context.route("**/bingo-leaderboard.json", (route) => {
      assert.equal(route.request().headers().cookie, undefined);
      return route.fulfill({
        status: mode === "error" ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          mode === "error"
            ? { detail: "Unavailable" }
            : {
                ...snapshot,
                entries: mode === "empty" ? [] : snapshot.entries,
              },
        ),
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/bingo-leaderboard`);
    await page.getByRole("table").waitFor();
    await page.addStyleTag({
      content: "astro-dev-toolbar{display:none!important}",
    });
    assert.deepEqual(
      await page.locator("tbody td.rank-col").allTextContents(),
      ["1", "1", "3", "4"],
    );
    assert.equal(
      await page.getByText("PROVISIONAL", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await page.screenshot({
      path: resolve(artifacts, `scores-${width}.png`),
      fullPage: true,
    });
    mode = "error";
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByText(/Showing the previous snapshot/).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 4);
    await page.screenshot({
      path: resolve(artifacts, `stale-${width}.png`),
      fullPage: true,
    });
    await page.reload();
    await page.getByText(/We couldn’t load the standings/).waitFor();
    assert.equal(await page.getByRole("table").count(), 0);
    assert.equal(
      await page.getByText("The field is open.", { exact: true }).count(),
      0,
    );
    mode = "empty";
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByText("The field is open.", { exact: true }).waitFor();
    await page.screenshot({
      path: resolve(artifacts, `empty-${width}.png`),
      fullPage: true,
    });
    reports.push({
      width,
      checks: [
        "shared ranks",
        "provisional label",
        "no horizontal overflow",
        "axe accessibility",
        "stale warning",
        "error distinct from empty",
        "empty state",
        "no cookies",
      ],
    });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(artifacts, "results.json"),
    JSON.stringify({ syntheticFixtures: true, reports, errors }, null, 2),
  );
  console.log(
    "Leaderboard desktop/mobile, privacy, empty/error/stale, and accessibility checks passed.",
  );
} finally {
  await browser.close();
}
