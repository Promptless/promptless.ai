// Public Formspark endpoint already used by the homepage and LavaCon page.
// Team inbox: https://dashboard.formspark.io/workspaces/sd9lLcQnV/forms/roBOd2Oxb/submissions
// Search for dogbench_book_request. Never send contact fields to analytics.
export const BOOK_REQUEST_ENDPOINT = 'https://submit-form.com/roBOd2Oxb';

type BookRequest = {
  name: string;
  email: string;
  company: string;
  physical_copy: 'yes' | 'no';
  _gotcha: string;
};

export function parseBookRequest(form: FormData):
  | { ok: true; data: BookRequest }
  | { ok: false; message: string } {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const name = value('name');
  const email = value('email');
  const company = value('company');
  const physical_copy = value('physical_copy');
  if (!name || name.length > 120) return { ok: false, message: 'Please enter your name (up to 120 characters).' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  if (company.length > 160) return { ok: false, message: 'Please shorten the company name to 160 characters.' };
  if (physical_copy !== 'yes' && physical_copy !== 'no') {
    return { ok: false, message: 'Please choose whether you would like a physical copy.' };
  }
  // Pass the honeypot to Formspark so its server-side spam filter can reject it.
  return { ok: true, data: { name, email, company, physical_copy, _gotcha: value('_gotcha') } };
}

export async function submitBookRequest(data: BookRequest, fetcher: typeof fetch = fetch): Promise<
  { ok: true } | { ok: false; message: string; rateLimited?: boolean }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetcher(BOOK_REQUEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      signal: controller.signal,
      body: JSON.stringify({
        ...data,
        form: 'dogbench_book_request',
        source: 'request_book',
        _email: { subject: 'Free DoGBench field guide request' },
      }),
    });
    if (response.status === 429) return { ok: false, rateLimited: true, message: 'Too many requests. Please wait a minute before trying again.' };
    if (!response.ok) return { ok: false, message: 'Your request was not accepted. Please try again, or contact hello@gopromptless.ai.' };
    return { ok: true };
  } catch {
    // A connection error can happen after the provider has saved the request.
    // Never automatically retry or claim a confirmed failure in that case.
    return { ok: false, message: "We couldn't confirm your request. Check your connection and try again, or contact hello@gopromptless.ai if you're unsure." };
  } finally {
    clearTimeout(timeout);
  }
}
