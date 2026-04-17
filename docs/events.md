# Marketing Event Glossary

Canonical reference for every PostHog event on promptless.ai.
Add new events here first, then implement.

## Conventions

- Snake_case, past tense: `email_captured`, `section_viewed`
- `location` — where on the site: `hero`, `nav`, `demo_page`, `blog`, `pricing_growth`, etc.
- `$set: { email }` — always identify when we capture an email
- `transport: 'sendBeacon'` — for events that fire on navigation/unload

---

## `email_captured`

Fires every time a visitor gives us their email, regardless of context.

| Property | Type | Description |
|----------|------|-------------|
| `intent` | string | Why they gave it: `demo`, `newsletter`, `free_tool` |
| `location` | string | Where: `hero`, `demo_page`, `blog`, `free_tools` |
| `campaign` | string | Campaign slug or empty |
| `$set: { email }` | string | Always set to identify the person |

**Sources**: HeroV2.astro, DemoBooking.astro, BlogRequestDemo.astro,
BlogNewsletterCTA.astro, BrokenLinkReportForm.astro

Replaces the old `demo_requested`, `blog_demo_requested`, and
`blog_newsletter_subscribed` events. The `broken_link_report_submitted` event
still fires separately with tool-specific properties — but `email_captured`
fires alongside it.

---

## `cta_clicked`

Fires on click of any element with `data-track-action`. Already implemented in
`AnalyticsClickTracker.astro`.

| Property | Type | Description |
|----------|------|-------------|
| `action` | string | What the CTA does (see values below) |
| `funnel_stage` | string | `conversion` or `evaluation` |
| `location` | string | Where the CTA lives |
| `campaign` | string | Campaign slug or empty |
| `link_url` | string | href of the element |

Current `action` values:

| action | locations |
|--------|-----------|
| `book_demo` | `hero`, `nav`, `mobile_menu`, `pricing_growth`, `pricing_enterprise`, `docs_welcome` |
| `sign_up` | `nav`, `mobile_menu`, `pricing_startup` |
| `sign_in` | `nav`, `mobile_menu` |
| `watch_demo` | `jobs_page` |
| `use_free_tool` | `free_tools` |
| `view_commits` | `demo_social_proof` |
| `wtd_sign_up` | `hero_callout` |
| `banner_cta` | `announcement_banner` |

The `nav` row is the highest-traffic CTA location — after the Apr 2026 redesign
it holds three buttons: Sign in (`sign_in`), Get a demo (`book_demo`), and
Start for free (`sign_up`).

Also fires `gtag('event', 'cta_click', ...)` for Google Analytics.

---

## `section_viewed`

Fires when a homepage section enters the viewport (50%+ visible). Once per
section per page load.

| Property | Type | Description |
|----------|------|-------------|
| `section` | string | Section name: `overview`, `testimonials`, `demo`, `how-promptless-works`, `capabilities` |
| `page` | string | Pathname (always `/` for homepage) |

**Component**: Inline IntersectionObserver in `posthog.astro`. Elements opt in
with `data-section-tracked="<name>"` — a data attribute (not id) so the desktop
and mobile testimonials variants can share a name without duplicate ids.

---

## `scroll_depth`

Fires at 25%, 50%, 75%, 100% scroll milestones on blog posts. Once per
milestone per page load.

| Property | Type | Description |
|----------|------|-------------|
| `percent` | number | `25`, `50`, `75`, `100` |
| `page` | string | Blog post pathname |

**Component**: Inline script scoped to blog post pages, measuring scroll
relative to the article content area.

---

## `video_played`

Fires when a visitor starts playing an embedded video.

| Property | Type | Description |
|----------|------|-------------|
| `video_id` | string | Video identifier (YouTube video ID or slug) |
| `video_title` | string | Human-readable title |
| `location` | string | Page where the video appears: `demo`, `homepage` |

**Component**: `VideoEmbed.astro`. The homepage demo now uses YouTube
(`AONpRsZJkTY`), which exposes the IFrame Player API — `video_played` and
`video_progress` are unblocked but not yet implemented.

---

## `video_progress`

Fires at 25%, 50%, 75%, 100% watch milestones.

| Property | Type | Description |
|----------|------|-------------|
| `video_id` | string | Same as `video_played` |
| `percent` | number | `25`, `50`, `75`, `100` |
| `seconds_watched` | number | Elapsed watch time |

**Component**: `VideoEmbed.astro`. Requires YouTube IFrame Player API.
Homepage demo switched to YouTube on 2026-04-16, so this is unblocked.

---

## `banner_dismissed`

Fires when a visitor closes an announcement banner.

| Property | Type | Description |
|----------|------|-------------|
| `campaign` | string | Banner campaign slug (e.g. `wtd_pre_conference`) |

**Component**: `AnnouncementBanner.astro`

---

## `pricing_bundle_changed`

Fires when a visitor changes the Growth plan page-range dropdown on /pricing.

| Property | Type | Description |
|----------|------|-------------|
| `bundle_id` | string | e.g. `growth-200-500` |
| `bundle_label` | string | e.g. `200-500 Pages` |
| `price_label` | string | e.g. `$500-$1,000/mo` |

**Component**: `GrowthBundleSelector.astro`

---

## `site_searched`

Fires when a visitor types 2+ characters in the Pagefind search input
(debounced 1s). Already implemented in `posthog.astro`.

| Property | Type | Description |
|----------|------|-------------|
| `query` | string | Search text |
| `page_url` | string | Pathname where the search happened |

---

## `broken_link_report_submitted`

Fires when a visitor submits the broken link checker tool. Already implemented
in `BrokenLinkReportForm.astro`. Note: `email_captured` also fires alongside
this event.

| Property | Type | Description |
|----------|------|-------------|
| `target_url` | string | URL to scan |
| `check_external` | boolean | Include external links |
| `check_anchors` | boolean | Include anchor links |
| `max_pages` | number \| null | Page limit |
| `$set: { email }` | string | Identifies the visitor |

---

## Implementation Priority

1. `email_captured` — consolidate all email capture, highest analytical value
2. `section_viewed` — understand homepage engagement depth
3. `pricing_bundle_changed` — understand pricing interest signals
4. `banner_dismissed` — measure banner effectiveness
5. `scroll_depth` — blog content engagement
6. `video_played` — homepage is on YouTube as of 2026-04-16, ready to implement
7. `video_progress` — homepage is on YouTube as of 2026-04-16, ready to implement
