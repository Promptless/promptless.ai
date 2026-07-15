/**
 * Contract tests for the MCP server, exercised through the real Fetch handler
 * (SDK-backed). Each call is an independent stateless request, which also proves
 * that `tools/list` / `tools/call` work without a same-instance `initialize`.
 * Run with `npm test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type AuthProvider, type Identity } from './auth/provider';
import type { DocEntry } from './index/types';
import { handleMcpRequest, type McpHandlerOptions } from './transport';

const index: DocEntry[] = [
  {
    title: 'Welcome',
    url: 'https://x/welcome/',
    path: '/welcome/',
    lang: 'en',
    access: 'public',
    groups: [],
    text: 'welcome getting started overview',
    markdown: '# Welcome\n\nhi',
  },
  {
    title: 'Secret',
    url: 'https://x/secret/',
    path: '/secret/',
    lang: 'en',
    access: 'internal',
    groups: ['partners'],
    text: 'secret internal partner content',
    markdown: '# Secret\n\nshh',
  },
];

const serverInfo = { name: 'test', version: '0.0.0' };

class StubAuth implements AuthProvider {
  readonly requiresAuth = false;
  constructor(private readonly identity: Identity) {}
  async authenticate(): Promise<Identity> {
    return this.identity;
  }
}

function opts(identity: Identity): McpHandlerOptions {
  return { index, authProvider: new StubAuth(identity), serverInfo, siteTitle: 'T', siteUrl: 'https://x/' };
}

const anon: Identity = { kind: 'anonymous' };

async function rpc(body: unknown, identity: Identity = anon): Promise<Response> {
  return handleMcpRequest(
    new Request('http://x/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(body),
    }),
    opts(identity),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcJson(body: unknown, identity: Identity = anon): Promise<{ status: number; json: any }> {
  const res = await rpc(body, identity);
  return { status: res.status, json: await res.json() };
}

const call = (id: number, name: string, args: Record<string, unknown>) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

test('initialize negotiates protocol + returns serverInfo', async () => {
  const { json } = await rpcJson({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'c', version: '1' } } });
  assert.equal(json.result.serverInfo.name, 'test');
  assert.ok(typeof json.result.protocolVersion === 'string');
});

test('tools/list (stateless, no prior initialize) exposes search + get_page', async () => {
  const { json } = await rpcJson({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(json.result.tools.map((t: { name: string }) => t.name).sort(), ['get_page', 'search']);
});

test('search returns ranked results with source URLs; internal hidden from anon', async () => {
  const ok = await rpcJson(call(3, 'search', { query: 'welcome' }));
  assert.match(ok.json.result.content[0].text, /Welcome/);
  assert.match(ok.json.result.content[0].text, /https:\/\/x\/welcome\//);

  const hidden = await rpcJson(call(4, 'search', { query: 'secret' }));
  assert.match(hidden.json.result.content[0].text, /No documentation matched/);
});

test('gating seam: internal page visible to a user in the group', async () => {
  const user: Identity = { kind: 'user', subject: 'u1', groups: ['partners'] };
  const { json } = await rpcJson(call(5, 'search', { query: 'secret' }), user);
  assert.match(json.result.content[0].text, /Secret/);
});

test('get_page found returns Markdown; missing returns a tool error', async () => {
  const ok = await rpcJson(call(6, 'get_page', { path: '/welcome/' }));
  assert.match(ok.json.result.content[0].text, /# Welcome/);

  const bad = await rpcJson(call(7, 'get_page', { path: '/missing/' }));
  assert.equal(bad.json.result.isError, true);
});

test('invalid tool args are rejected by the SDK (zod)', async () => {
  const { json } = await rpcJson(call(8, 'search', { query: '' })); // min(1) violated
  // Either a JSON-RPC error or an isError tool result is acceptable.
  assert.ok(json.error || json.result?.isError, 'expected an error for empty query');
});

test('resources: list + read the llms.txt index', async () => {
  const list = await rpcJson({ jsonrpc: '2.0', id: 9, method: 'resources/list' });
  const uri = list.json.result.resources[0].uri;
  assert.ok(uri);
  const read = await rpcJson({ jsonrpc: '2.0', id: 10, method: 'resources/read', params: { uri } });
  assert.match(read.json.result.contents[0].text, /# T/);
});

test('transport: OPTIONS 204 with CORS; notification accepted', async () => {
  const optionsRes = await handleMcpRequest(new Request('http://x/mcp', { method: 'OPTIONS' }), opts(anon));
  assert.equal(optionsRes.status, 204);
  assert.equal(optionsRes.headers.get('access-control-allow-origin'), '*');

  const note = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.ok(note.status === 202 || note.status === 200);
});

test('disabled flag short-circuits with 503', async () => {
  const res = await handleMcpRequest(
    new Request('http://x/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }),
    { ...opts(anon), enabled: false },
  );
  assert.equal(res.status, 503);
});

// --- Regression tests for adversarial-review findings ---

test('GET is rejected with 405 and does not hang (#1: SSE buffer deadlock)', async () => {
  const res = (await Promise.race([
    handleMcpRequest(
      new Request('http://x/mcp', { method: 'GET', headers: { accept: 'text/event-stream' } }),
      opts(anon),
    ),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('handler hung on GET')), 2000)),
  ])) as Response;
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'POST, OPTIONS');
});

test('search matches CJK content (#3: Unicode tokenizer)', async () => {
  const cjkIndex: DocEntry[] = [
    {
      title: '文档',
      url: 'https://x/zh/',
      path: '/zh/',
      lang: 'zh',
      access: 'public',
      groups: [],
      text: '文档 概述 入门 指南',
      markdown: '# 文档',
    },
  ];
  const res = await handleMcpRequest(
    new Request('http://x/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(call(40, 'search', { query: '文档' })),
    }),
    { index: cjkIndex, authProvider: new StubAuth(anon), serverInfo, siteTitle: 'T', siteUrl: 'https://x/' },
  );
  const json = await res.json();
  assert.match(json.result.content[0].text, /文档/);
});

test('get_page matches case-insensitively (#6)', async () => {
  const { json } = await rpcJson(call(41, 'get_page', { path: '/WELCOME/' }));
  assert.match(json.result.content[0].text, /# Welcome/);
});

test('a specific CORS origin sets Allow-Credentials (#4)', async () => {
  const res = await handleMcpRequest(new Request('http://x/mcp', { method: 'OPTIONS' }), {
    ...opts(anon),
    corsAllowOrigin: 'https://client.example',
  });
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://client.example');
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
});
