#!/usr/bin/env node

// Extract cookies from a running Chrome instance for Doc Detective.
//
// Usage:
//   1. Quit Chrome completely
//   2. Relaunch Chrome with remote debugging:
//      /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
//   3. Sign in to app.gopromptless.ai in that Chrome window
//   4. Run this script: node .doc-detective/extract-cookies.js
//
// This writes cookies in Netscape format to .doc-detective/session-cookies.txt
// which Doc Detective can load via the loadCookie action.

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, 'session-cookies.txt');
const URLS = [
  'https://app.gopromptless.ai',
  'https://accounts.gopromptless.ai',
];

async function extractCookies() {
  let browser;
  try {
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  } catch (err) {
    console.error('Could not connect to Chrome on port 9222.');
    console.error('Launch Chrome with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
    process.exit(1);
  }

  const page = (await browser.pages())[0];

  const allCookies = [];
  for (const url of URLS) {
    const cookies = await page.cookies(url);
    allCookies.push(...cookies);
  }

  // Deduplicate by name+domain
  const seen = new Set();
  const unique = allCookies.filter((c) => {
    const key = `${c.name}|${c.domain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Write Netscape cookie format
  const lines = unique.map(
    (c) =>
      `${c.domain}\tTRUE\t${c.path}\t${c.secure ? 'TRUE' : 'FALSE'}\t${Math.floor(c.expires)}\t${c.name}\t${c.value}`
  );
  const content = '# Netscape HTTP Cookie File\n' + lines.join('\n') + '\n';
  fs.writeFileSync(OUTPUT_PATH, content);

  console.log(`Exported ${unique.length} cookies to ${OUTPUT_PATH}`);
  browser.disconnect();
}

extractCookies().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
