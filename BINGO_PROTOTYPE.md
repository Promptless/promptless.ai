# AI Tells Bingo prototype

The `/bingo` game lets LavaCon visitors collect examples on a randomized 5×5 card. Play starts immediately. IndexedDB saves the board and photos on the device. Entering an email in the inline form and selecting **Save** starts an optional six-digit code flow and private server saving through the companion `Promptless/promptless` change.

Email saving requires the configuration below. Local verification uses synthetic photos and a fake inbox; live email delivery and physical phone cameras still need a launch smoke test.

## Run the game

With the repository’s Node dependencies installed, start the preview:

```sh
NODE_ENV=development npm run dev -- --host 127.0.0.1 --port 4387
```

Open `http://127.0.0.1:4387/bingo`. Select a square, take or upload a photo, then review the processed image before saving. Open a marked square to replace or remove its evidence. After email verification, Manage saving handles saved boards and restoration.

Without server configuration, the board works locally and the email form explains that cross-device saving is unavailable. After the page loads, local saves work offline. An offline first load or reload is not supported.

## Configure private saving

The website uses a server route at `/bingo-api/...`. This avoids the generic `/api` redirect and keeps the session cookie on the website’s origin. Configure these server-only variables:

| Variable             | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| `BINGO_API_BASE_URL` | Backend URL ending in `/bingo`                                 |
| `BINGO_PROXY_SECRET` | The same random secret as backend `RUNTIME_BINGO_PROXY_SECRET` |

The backend uses its existing Resend service and verified sender. See `runtime/bingo/README.md` in the companion backend checkout for migration, session, delivery, retention, and rate-limit details. No password or Clerk redirect is involved. Entering an email alone never retrieves progress or photos.

For local integration tests, run the backend’s guarded `runtime.bingo.tests.local_app` harness on `127.0.0.1:5019`. It requires an empty migrated local database and `BINGO_TEST_MODE=local-only`. Export the frontend variables with `BINGO_API_BASE_URL=http://127.0.0.1:5019/bingo` and the synthetic `PROXY_SECRET` from `runtime/bingo/tests/test_bingo.py`. Start the frontend on port 4388. The fake inbox captures codes at `http://127.0.0.1:5019/__test__/inbox`; it sends no email. Never use the test secret or harness in production.

## Understand saving and recovery

A local transaction commits the photo and progress together. Quota errors and stale-tab edits keep the last saved board intact. A random UUID identifies the board. Email is neither a browser lookup key nor a server credential.

After code verification, the proxy stores a random server session in an HttpOnly cookie. Production cookies are Secure and SameSite=Lax. Browser JavaScript never receives the session token. Every server read and mutation checks ownership. Every mutation also requires the exact browser origin.

Photo changes sync individually after the local save. A persisted checkpoint records the acknowledged server revision and photo digests. If another device changed the board, saving stops with a visible conflict. Restoring a saved version preserves the local board as a selectable backup. Repeated restores keep earlier backups until the visitor explicitly deletes local data. A failed restore never commits partial downloads.

The game supports one saved board per verified email. It does not merge competing versions automatically. Sign-out revokes the session but keeps local evidence. Deleting the saved copy removes the server board and photos while keeping device data. Clearing the browser’s site data removes the active local board and local backups but leaves the server copy. Anyone using the same browser profile can see its device data.

## Use the agreed 24 tells

`src/lib/bingo/patterns.ts` contains the agreed card set. **Asyndetic parataxis** includes a plain-language hint, plus optional ellipsis and repeated-closure details for writers. Examples are hypothetical. No square establishes AI authorship, and the game assigns no authorship probability.

The card has a free center and recognizes every row, column, and diagonal. There is no timer, correctness grading, or public leaderboard. Earlier prototype cards retain their original square IDs, hints, order, and photos through `legacy-patterns.ts`.

The [AIStoryHub reference](https://aistoryhub.co/bingo) informed the general interaction. No code, artwork, or full third-party corpus was copied.

## Handle photos

The camera picker requests the rear camera. The separate library picker accepts JPEG, PNG, and WebP. HEIC receives a conversion message. Input validation checks MIME, file signatures, and a 12 MiB input limit. Images above 40 megapixels are rejected after decoding.

Canvas processing removes metadata and filenames, flattens transparency, and produces a JPEG at most 1600 pixels on its longest edge and 1 MiB. A board holds at most 24 photos. The backend repeats format, size, and pixel checks and re-encodes before persistence. Private JPEGs are stored in the existing Postgres database for this event implementation. No public gallery, public storage URL, analytics, or session replay is included.

## Verify the feature

The frontend commands are:

```sh
npm run test:bingo
npm run check
npm run test:bingo:browser
npm run test:bingo:cloud
```

The browser tests use fresh Chrome profiles and synthetic photos. They never open personal browser profiles. Set `CHROME_PATH`, `BINGO_URL`, and `BINGO_ARTIFACT_DIR` to override the defaults. Run browser tests after the production build finishes; concurrent Astro build and dev processes can conflict over generated caches.

Validation completed locally:

- Ten unit tests cover game rules, validation, proxy cookie handling, origin checks, bounded bodies, malformed verification, and session expiry.
- The full frontend check passes, including type checking, existing Markdown/MCP/search tests, and the Vercel production build.
- Anonymous browser tests pass at widths 320, 375, 390, 768, and 1280 px, with no horizontal overflow, page errors, or axe violations in the tested states.
- Browser photo checks cover cancellation, repeated taps, invalid inputs, EXIF removal, replacement/removal, quota failures, reload, offline saves, earlier cards, and win detection.
- Two isolated browsers pass email verification, wrong-code retry, private restoration, offline sync, stale-device conflicts, local backup recovery, lost upload responses, sign-out, and server deletion.
- The companion backend passes 35 focused feature, environment-contract, and migration tests, plus full runtime Ruff and ty checks. Its PR records unrelated failures from the full runtime suite and the comparison against unchanged `main`.

Reports and screenshots are under `tmp/bingo-evidence/` and `tmp/bingo-cloud-evidence/`. Physical iOS/Android cameras and real Resend delivery remain unverified.

## Decide before launch

Prithvi needs to approve the existing sender for Bingo, the shared proxy-secret configuration, and activation of the two deployments. No new auth provider is needed.

Approve the proposed 30-day inactivity expiry, a scheduled physical-deletion owner, and the 1 GiB event photo-storage cap. Current cleanup runs on accepted code requests, so it does not guarantee physical deletion on the expiry date. Database backups retain their existing policy. Review the 60-code-per-IP-per-hour limit for a shared booth network.

Test actual iOS Safari and Android Chrome camera/library flows, including large photos and cancellation. Approve any prize/redemption rules separately. The game does not subscribe email addresses to marketing. Keep `noindex` until the route is approved for launch.

## Find the changes

The main files are:

- `src/pages/bingo.astro` and `src/styles/bingo.css`: standalone responsive game.
- `src/components/bingo/`: board, photo dialogs, and email-code saving controls.
- `src/lib/bingo/`: editorial cards, rules, image processing, IndexedDB, sync, and server proxy.
- `src/pages/bingo-api/[...path].ts`: same-origin server endpoint.
- `tests/bingo/`: unit and browser regression tests.
- `.env.example`, `package.json`, and `package-lock.json`: optional configuration and test tooling.

Frontend branch: `codex/ai-tells-bingo`. Companion backend branch: `codex/bingo-email-save`.
