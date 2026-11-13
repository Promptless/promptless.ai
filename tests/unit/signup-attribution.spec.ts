import assert from 'node:assert/strict';
import test from 'node:test';

import { attributedAppHref, captureSignupAttribution, observeSignupAttribution } from '../../src/lib/signup-attribution';

const NOW = new Date('2026-10-27T19:00:00Z');

test('Google and LinkedIn referrals survive marketing navigation into signup', () => {
  for (const [referrer, source] of [['https://www.google.com/search?q=private', 'google'], ['https://www.linkedin.com/feed/', 'linkedin'], ['https://claude.com/', 'claude']]) {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const landing = captureSignupAttribution('https://promptless.ai/blog/agent-docs?token=secret#private', referrer, storage, NOW);
    const pricing = captureSignupAttribution('https://promptless.ai/pricing', 'https://promptless.ai/blog/agent-docs', storage, NOW);
    assert.deepEqual(pricing, landing);
    const destination = new URL(attributedAppHref('https://app.gopromptless.ai/sign-up?redirect_url=%2Fonboarding#continue', 'https://promptless.ai/pricing', pricing));
    assert.equal(destination.pathname, '/sign-up');
    assert.equal(destination.searchParams.get('redirect_url'), '/onboarding');
    assert.equal(destination.hash, '#continue');
    const handoff = JSON.parse(destination.searchParams.get('signup_attribution')!);
    assert.equal(handoff.source, source);
    assert.equal(handoff.landing_path, '/blog/agent-docs');
    assert.equal(handoff.referrer_host, new URL(referrer).hostname);
    assert.ok(!JSON.stringify(handoff).includes('secret'));
    assert.ok(!JSON.stringify(handoff).includes('private'));
  }
});

test('bounded campaign fields take precedence over a referring host', () => {
  const attribution = observeSignupAttribution(`https://promptless.ai/?utm_source=ChatGPT&utm_medium=connector&utm_campaign=${'a'.repeat(400)}`, 'https://www.google.com/', NOW);
  assert.equal(attribution.source, 'chatgpt');
  assert.equal(attribution.evidence, 'utm');
  assert.equal(attribution.utm_campaign?.length, 200);
});

test('attribution is sent only to exact HTTPS app origins', () => {
  const attribution = observeSignupAttribution('https://promptless.ai/', '', NOW);
  for (const href of ['https://app.gopromptless.ai/sign-up', 'https://app.promptless.ai/sign-in']) {
    assert.ok(new URL(attributedAppHref(href, 'https://promptless.ai', attribution)).searchParams.has('signup_attribution'));
  }
  for (const href of ['/pricing', 'https://app.gopromptless.ai.evil.com/sign-up', 'https://app.promptless.ai:9443/', 'http://app.promptless.ai/', 'https://user:password@app.promptless.ai/', 'https://github.com/Promptless/promptless', 'mailto:hi@promptless.ai', 'javascript:alert(1)']) {
    assert.equal(attributedAppHref(href, 'https://promptless.ai', attribution), href);
  }
});

test('expired and malformed stored attribution is replaced', () => {
  let raw = JSON.stringify(observeSignupAttribution('https://promptless.ai/?utm_source=linkedin', '', new Date('2020-01-01T00:00:00Z')));
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  assert.equal(captureSignupAttribution('https://promptless.ai/', '', storage, NOW).source, 'direct');
  raw = '{invalid';
  assert.equal(captureSignupAttribution('https://promptless.ai/', 'https://www.google.com/', storage, NOW).source, 'google');
});

test('storage-free capture and deceptive referrer hosts remain safe', () => {
  assert.equal(captureSignupAttribution('https://promptless.ai/', 'https://google.evil.com/', null, NOW).source, 'referral');
  assert.equal(observeSignupAttribution('https://promptless.ai/pricing', 'https://promptless.ai/', NOW).source, 'unknown');
});

test('unknown attribution can be clarified by a later referral but observed direct stays first touch', () => {
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  assert.equal(captureSignupAttribution('https://promptless.ai/', 'https://promptless.ai/pricing', storage, NOW).source, 'unknown');
  assert.equal(captureSignupAttribution('https://promptless.ai/', 'https://www.google.com/', storage, NOW).source, 'google');
  raw = null;
  assert.equal(captureSignupAttribution('https://promptless.ai/', '', storage, NOW).source, 'direct');
  assert.equal(captureSignupAttribution('https://promptless.ai/', 'https://www.google.com/', storage, NOW).source, 'direct');
});
