# AI Tells Bingo prototype

The `/bingo` game lets LavaCon visitors collect examples on a randomized 5×5 card. Play starts immediately. IndexedDB saves the board and photos on the device. Entering an email in the inline form and selecting **Save** starts an optional six-digit code flow and private server saving through the companion `Promptless/promptless` change.

Email saving requires the configuration below. Local verification uses synthetic photos and a fake inbox; live email delivery and physical phone cameras still need a launch smoke test.

## Run the game

With the repository’s Node dependencies installed, start the preview:

```sh
NODE_ENV=development npm run dev -- --host 127.0.0.1 --port 4387
```

Open `http://127.0.0.1:4387/bingo`. Select a square, take or upload a photo, then review the processed image before saving. Open a marked square to replace or remove its evidence. After email verification, Manage saving handles saved boards and restoration.

The page checks the same-origin session route before enabling the email form. Without working server configuration, it shows the saving error and a **Retry connection** button; the board and photos still work locally. A signed-out `401` makes the form available, while `403`, `503`, and network errors keep the unavailable state visible. After the page loads, local saves work offline. An offline first load or reload is not supported.

## Configure private saving

The website uses a server route at `/bingo-api/...`. This avoids the generic `/api` redirect and keeps the session cookie on the website’s origin. Configure these server-only variables:

| Variable             | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| `BINGO_API_BASE_URL` | Backend URL ending in `/bingo`                                 |
| `BINGO_PROXY_SECRET` | The same random secret as backend `RUNTIME_BINGO_PROXY_SECRET` |

The backend uses its existing Resend service and verified sender. See `runtime/bingo/README.md` in the companion backend checkout for migration, session, delivery, retention, and rate-limit details. No password or Clerk redirect is involved. Entering an email alone never retrieves progress or photos.

The server route reads these through `astro:env/server` so local `.env.local` configuration and the deployed adapter's runtime environment both work. Set the values in the Vercel environment that actually serves the game, then create an approved deployment; adding values does not change an already-running deployment. Never put the proxy secret into a public variable or client code.

### Production activation

Code changes alone do not enable email delivery. The October 25, 2026 investigation found both website variables absent from Vercel Production on team `promptless`, project `promptless-docs` (`promptless.ai`). Unauthenticated reads returned `503` from both `/bingo-api/session` and `https://api.gopromptless.ai/bingo/session`.

After AWS SSO was refreshed, read-only production checks identified the exact runtime guard failure: `RUNTIME_BINGO_PROXY_SECRET` is absent or empty in Kubernetes `promptless/runtime-env` and absent from two running runtime replicas. The database connection, Redis URL, Resend API key, and sender are present. Redis PING succeeded. Resend's read-only domain endpoint returned `200` and confirmed the configured sender domain is verified with sending enabled; no email was sent and no values were printed. The deployed runtime image is `4a76d952dd7c86c855636dc259f9d9a52ed7660a`.

Migration job logs record `f5f7d7fdc66f` applied, and `runtime-bingo-retention` is enabled at `23 * * * *`, with a successful database-backed cleanup at `2026-10-25T21:23:27Z`. These checks establish the existing deployment prerequisites, but do not prove email delivery or a new board/photo write. The source field inside AWS Secrets Manager was not read; reuse it if already provisioned rather than rotating an existing secret unnecessarily.

Use this approval checklist before activation:

1. Have the secret owner confirm whether `RUNTIME_BINGO_PROXY_SECRET` already exists in AWS Secrets Manager `prod/runtime/all` in `us-east-2`. If absent, a human supplies a new random value of at least 32 characters through the approved secret-management process, preserving every other source key. Do not print or commit it. This source is projected by `runtime-ops/terraform` into Kubernetes `promptless/runtime-env`; it is not an application setting in the website repository.
2. Approve projecting that one setting and refreshing the runtime pods so they receive it. Review the Terraform plan and exclude unrelated changes. No new service, purchase, IAM grant, or database migration is indicated. Verify the resulting pods have the value without displaying it. Keep the already-successful Bingo migration and retention job intact; never downgrade the migration to disable saving because that would delete saved data.
3. Approve using the existing verified sender for Bingo and confirm the existing Resend quota. A verified sending domain was confirmed, but available quota and actual delivery were not tested. No provider credential replacement is indicated.
4. In Vercel team `promptless`, project `promptless-docs`, add Production `BINGO_API_BASE_URL=https://api.gopromptless.ai/bingo` and encrypted `BINGO_PROXY_SECRET` equal to the approved runtime value. Redeploy through the approved website process. Preview configuration is a separate choice; keep test environments on synthetic data and fake inboxes.
5. Without sending email, read `https://promptless.ai/bingo-api/session` without cookies. Expect `401` once both sides are configured. A website `503` indicates missing/invalid website configuration or an unavailable upstream; an upstream `403` indicates mismatched proxy authentication. This read verifies reachability and the enablement guard only, not email delivery, database migrations, or storage health.
6. With explicit permission and a designated test recipient, request one code, verify it, save a synthetic photo, and restore it in a second isolated browser. Confirm that a failed code request or upload preserves local progress. This live-email/storage smoke test has not been run as part of the code PR.

Secret setup/projection, production configuration and rollout, merging the website PR, and a live-email smoke test remain separate approval decisions. The website PR must not be described as restoring production email saving until this sequence completes.

For local integration tests, run the backend’s guarded `runtime.bingo.tests.local_app` harness on `127.0.0.1:5019`. It requires an empty migrated local database and `BINGO_TEST_MODE=local-only`. Export the frontend variables with `BINGO_API_BASE_URL=http://127.0.0.1:5019/bingo` and the synthetic `PROXY_SECRET` from `runtime/bingo/tests/test_bingo.py`. Start the frontend on port 4388. The fake inbox captures codes at `http://127.0.0.1:5019/__test__/inbox`; it sends no email. Never use the test secret or harness in production.

## Understand saving and recovery

A local transaction commits the photo and progress together. Quota errors and stale-tab edits keep the last saved board intact. A random UUID identifies the board. Email is neither a browser lookup key nor a server credential.

After code verification, the proxy stores a random server session in an HttpOnly cookie. Production cookies are Secure and SameSite=Lax. Browser JavaScript never receives the session token. Every server read and mutation checks ownership. Every mutation also requires the exact browser origin.

Photo changes sync individually after the local save. A persisted checkpoint records the acknowledged server revision and photo digests. If another device changed the board, saving stops with a visible conflict. Restoring a saved version preserves the local board as a selectable backup. Repeated restores keep earlier backups until the visitor explicitly deletes local data. A failed restore never commits partial downloads.

Verification does not count as a successful board save. If the initial upload fails, the panel stays open with the failure and a retry action. Consumed verification challenges are cleared, and an expired session returns to email verification without changing the local board or photos.

The game supports one saved board per verified email. It does not merge competing versions automatically. Sign-out revokes the session but keeps local evidence. Deleting the saved copy removes the server board and photos while keeping device data. Clearing the browser’s site data removes the active local board and local backups but leaves the server copy. Anyone using the same browser profile can see its device data.

## Use the agreed 24 tells

`src/lib/bingo/patterns.ts` contains the agreed card set. **Asyndetic parataxis** includes a plain-language hint, plus optional ellipsis and repeated-closure details for writers. Examples are hypothetical. No square establishes AI authorship, and the game assigns no authorship probability.

The card has a free center and recognizes every row, column, and diagonal. Play is untimed, and the game doesn't grade whether a photo matches its square. Saved boards appear on the provisional [`/bingo-leaderboard`](README.md#ai-tells-bingo-leaderboard) under anonymous aliases until organizers review the photos. Earlier prototype cards retain their original square IDs, hints, order, and photos through `legacy-patterns.ts`.

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
npm run test:bingo:email
npm run test:bingo:cloud
```

The browser tests use fresh Chrome profiles and synthetic photos. They never open personal browser profiles. Set `CHROME_PATH`, `BINGO_URL`, and `BINGO_ARTIFACT_DIR` to override the defaults. Run browser tests after the production build finishes; concurrent Astro build and dev processes can conflict over generated caches.

`test:bingo:email` uses an unconfigured local dev server and browser-mocked saving APIs, with all external browser requests blocked. It covers unavailable configuration, local-photo persistence through reload, connection retry, failed code delivery/resend, invalid/expired codes, failed initial upload/retry, session expiry, and a second-device restore. It does not test a real provider or database; `test:bingo:cloud` retains the separate runtime fake-inbox integration suite.

Validation completed locally:

- Fourteen unit tests cover game rules, validation, configuration guards, proxy cookie handling, origin checks, bounded bodies, malformed verification, session expiry, and save-failure recovery.
- The full frontend check passes, including type checking, existing Markdown/MCP/search tests, and the Vercel production build.
- Anonymous browser tests pass at widths 320, 375, 390, 768, and 1280 px, with no horizontal overflow, page errors, or axe violations in the tested states.
- Browser photo checks cover cancellation, repeated taps, invalid inputs, EXIF removal, replacement/removal, quota failures, reload, offline saves, earlier cards, and win detection.
- Two isolated browsers pass email verification, wrong-code retry, private restoration, offline sync, stale-device conflicts, local backup recovery, lost upload responses, sign-out, and server deletion.
- The companion backend PR records its current runtime CI, focused regression tests, and full runtime Ruff and ty results.

Reports and screenshots are under `tmp/bingo-evidence/` and `tmp/bingo-cloud-evidence/`. Physical iOS/Android cameras and real Resend delivery remain unverified.

## Decide before launch

Prithvi needs to approve the existing sender for Bingo, the shared proxy-secret configuration, and activation of the two deployments. No new auth provider is needed.

The backend defaults support about 100 players sharing conference Wi-Fi: 600 code requests per IP per hour, 2,000 across the event per rolling day, and 3 GiB of stored photos. The per-email limit remains five requests per hour. Boards expire after 30 days of inactivity, and the runtime's hourly Bingo retention job deletes expired boards and photos independently of traffic. Database backups retain their existing policy. Confirm the retention job is deployed when enabling saving.

The existing runtime Redis paces code delivery across web pods. Code requests allow up to 45 seconds in the browser for a busy booth; ordinary board/photo requests keep their shorter timeout. Confirm the existing Resend account has enough email quota before activation.

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
