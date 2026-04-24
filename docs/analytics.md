# Website Analytics (PostHog)

PostHog tracks visitor behavior on promptless.ai. This doc covers the current
setup, the event catalog, known gaps, and recommendations.

## Setup

- **PostHog snippet**: `src/components/posthog.astro` -- inline script that
  loads the PostHog JS SDK. Configured via `PUBLIC_POSTHOG_PROJECT_TOKEN` and
  `PUBLIC_POSTHOG_HOST` env vars.
- **Click tracker**: `src/components/shared/AnalyticsClickTracker.astro` --
  global delegated click handler. Any element with `data-track-action` emits a
  `cta_clicked` event with structured properties.
- **Autocapture**: PostHog autocapture is enabled (pageviews, clicks, web
  vitals, rageclicks).

## Event Catalog

### Well-instrumented events

| Event | Properties | Source |
|-------|-----------|--------|
| `cta_clicked` | `action`, `funnel_stage`, `location`, `campaign`, `link_url` | AnalyticsClickTracker (data-track-* attrs) |
| `demo_requested` | `location` (hero / demo_page), `$set.email` | Hero.astro, DemoBooking.astro |
| `blog_demo_requested` | `location` (blog), `$set.email` | BlogRequestDemo.astro |
| `broken_link_report_submitted` | `target_url`, `check_external`, `check_anchors`, `max_pages`, `$set.email` | BrokenLinkReportForm.astro |
| `site_searched` | `query`, `page_url` | posthog.astro (MutationObserver on Pagefind input) |

### Poorly-instrumented events

| Event | Problem |
|-------|---------|
| `demo:video_watched` | No properties. Cannot tell which video, how much was watched, or where. |
| `demo:video_clicked` | No properties. Duplicate of `demo_video_clicked`. |
| `demo_video_engaged` | No properties. Unclear how this differs from `demo:video_watched`. |
| `demo_video_clicked` | No properties. Duplicate of `demo:video_clicked`. |

These video events likely originate from tella.tv postMessage or PostHog
autocapture on the iframe. The `VideoEmbed.astro` component has no tracking
code.

## data-track-* Attribute Convention

To track a CTA click, add these attributes to any clickable element:

```html
<a
  href="/demo"
  data-track-action="book_demo"
  data-track-funnel="conversion"
  data-track-location="hero"
  data-track-campaign=""
>Book demo</a>
```

The AnalyticsClickTracker fires `cta_clicked` with these as properties. It also
sends a parallel `gtag` event for Google Analytics.

### Current action values in use

- `book_demo` -- hero, nav, pricing_growth
- `sign_up` -- nav, pricing_startup, mobile_menu
- `sign_in` -- mobile_menu
- `watch_demo` -- jobs_page
- `use_free_tool` -- free_tools
- `view_commits` -- demo_social_proof

## Design Decisions

### Localhost capture is intentional

PostHog captures events from localhost (dev server on ports 4321/4322) in the
same project as production. This is deliberate -- it lets us test tracking
changes during local development without a separate PostHog project. When
filtering production analytics, use a property filter on `$host` to exclude
`localhost` and `127.0.0.1`.

## Known Issues

### 1. Video tracking is blind

`VideoEmbed.astro` embeds a tella.tv iframe with no tracking. We have no
visibility into video engagement (play, pause, watch percentage, completion).

**Fix**: Listen for tella.tv postMessage events (if available) or replace with
a video player that exposes JS events, then emit structured events:

```js
posthog.capture('video_played', {
  video_id: 'promptless-1-0',
  video_title: 'Introducing Promptless 1.0',
  location: 'demo_page',  // or 'docs', 'homepage'
});

posthog.capture('video_progress', {
  video_id: 'promptless-1-0',
  percent: 50,
  seconds_watched: 45,
});
```

### 2. No section visibility tracking

Cannot tell which homepage sections visitors actually see (How It Works,
Testimonials, Social Proof, Pricing Cards). This matters for optimizing page
layout and knowing if below-fold content is effective.

**Fix**: Add IntersectionObserver-based section tracking:

```js
posthog.capture('section_viewed', {
  section: 'how_it_works',  // or 'testimonials', 'social_proof', 'pricing'
  page: '/',
});
```

### 3. No scroll depth on blog posts

Cannot tell if blog visitors read to the CTA at the bottom.

### 4. Inconsistent video event names

Four different events for video interaction (`demo:video_watched`,
`demo:video_clicked`, `demo_video_engaged`, `demo_video_clicked`). Should
consolidate to a consistent naming scheme: `video_played`, `video_progress`,
`video_completed`.

### 5. Missing pricing interaction events

No events for pricing card hover, toggle (monthly/annual), or feature
comparison clicks.

## Referring Domains (top sources, last 14 days)

1. Direct traffic (~60%)
2. google.com (~15%)
3. linkedin.com (~5%)
4. ycombinator.com
5. Slack (com.slack)
6. news.ycombinator.com (HN)
7. github.com
8. writethedocs.org

## Top Pages by Pageviews

1. `/` (homepage)
2. `/docs/getting-started/welcome`
3. `/demo`
4. `/pricing`
5. `/jobs`
6. `/blog`
7. `/wtd-portland-2026`
8. `/free-tools`
9. `/changelog`
