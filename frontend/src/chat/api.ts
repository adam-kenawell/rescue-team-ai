// Chat API client — fetch wrappers for session endpoints

import type { PollResponse } from './types.js';

/** Parse error message from a non-ok response */
async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Send a user message to the session */
export async function sendMessage(
  baseUrl: string, sessionId: number, content: string,
  llmHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}/session/${sessionId}/message/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...llmHeaders },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Poll session state, optionally filtering messages since a timestamp */
export async function pollState(baseUrl: string, sessionId: number, since: string | null): Promise<PollResponse> {
  let url = `${baseUrl}/session/${sessionId}/state/`;
  if (since) {
    url += `?since=${encodeURIComponent(since)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** End (force-stop) a session */
export async function endSession(baseUrl: string, sessionId: number): Promise<void> {
  const res = await fetch(`${baseUrl}/session/${sessionId}/end/`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
}
