import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const PREVIEW_HOST = '127.0.0.1';
const STARTUP_TIMEOUT_MS = 25_000;
const REQUEST_TIMEOUT_MS = 3_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;
const dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(dirname, '..', '..');

export interface PreviewServer {
  baseUrl: string;
  close: () => Promise<void>;
}

async function ensureBuildOutput() {
  const distPath = path.join(ROOT, 'dist', 'index.html');
  try {
    await access(distPath);
  } catch {
    throw new Error(
      `Missing build output at ${distPath}. Run \"npm run build\" (or \"npm run check\") before smoke tests.`
    );
  }
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, PREVIEW_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate a free preview port.')));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

async function waitForServerReady(baseUrl: string, child: ChildProcessWithoutNullStreams) {
  const start = Date.now();
  let lastError = '';

  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      throw new Error(
        `Preview server exited early with code ${child.exitCode}. ${lastError}`.trim()
      );
    }

    try {
      const response = await fetch(`${baseUrl}/docs/getting-started/welcome`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return;
    } catch (error) {
      lastError = String(error);
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for preview server at ${baseUrl}. ${lastError}`.trim());
}

async function waitForExit(
  child: ChildProcessWithoutNullStreams,
  timeoutMs: number
): Promise<boolean> {
  if (child.exitCode !== null) return true;

  let onExit: (() => void) | undefined;
  const exited = await Promise.race([
    new Promise<boolean>((resolve) => {
      onExit = () => resolve(true);
      child.once('exit', onExit);
    }),
    sleep(timeoutMs).then(() => false),
  ]);

  if (onExit) {
    child.off('exit', onExit);
  }

  return exited;
}

async function stopServer(child: ChildProcessWithoutNullStreams) {
  const killProcessTree = (signal: NodeJS.Signals) => {
    const pid = child.pid;
    if (!pid) return;

    try {
      // Detached mode creates a new process group so we can terminate npm + astro children.
      process.kill(-pid, signal);
    } catch {
      child.kill(signal);
    }
  };

  killProcessTree('SIGTERM');
  if (!(await waitForExit(child, SHUTDOWN_TIMEOUT_MS))) {
    killProcessTree('SIGKILL');
    await waitForExit(child, SHUTDOWN_TIMEOUT_MS);
  }

  child.stdout.destroy();
  child.stderr.destroy();
}

export async function startPreviewServer(): Promise<PreviewServer> {
  await ensureBuildOutput();

  const port = await getFreePort();
  const baseUrl = `http://${PREVIEW_HOST}:${port}`;
  const child = spawn('npm', ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(port)], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    logs += String(chunk);
  });

  try {
    await waitForServerReady(baseUrl, child);
  } catch (error) {
    await stopServer(child);
    throw new Error(`${String(error)}\n${logs}`.trim());
  }

  return {
    baseUrl,
    close: async () => {
      await stopServer(child);
    },
  };
}
