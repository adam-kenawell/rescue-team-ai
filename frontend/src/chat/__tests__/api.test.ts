import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, pollState, endSession } from '../api.js';
import type { PollResponse } from '../types.js';

const BASE = 'http://localhost:8000/api';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('sendMessage', () => {
  it('sends POST with content and returns JSON', async () => {
    const mockResponse = { orchestrator_response: 'ok', plan: { steps: [] }, partner_target: null };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await sendMessage(BASE, 1, 'hello');
    expect(fetch).toHaveBeenCalledWith(`${BASE}/session/1/message/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' }),
    });
    expect(result).toEqual(mockResponse);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad' }), { status: 400 }),
    );
    await expect(sendMessage(BASE, 1, '')).rejects.toThrow('bad');
  });
});

describe('pollState', () => {
  it('sends GET with since param and returns PollResponse', async () => {
    const mockPoll: PollResponse = {
      session_status: 'active',
      agents: [],
      messages: [],
      partner_target: null,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockPoll), { status: 200 }));

    const result = await pollState(BASE, 1, '2026-01-01T00:00:00Z');
    expect(fetch).toHaveBeenCalledWith(`${BASE}/session/1/state/?since=2026-01-01T00%3A00%3A00Z`);
    expect(result).toEqual(mockPoll);
  });

  it('sends GET without since param when null', async () => {
    const mockPoll: PollResponse = { session_status: 'active', agents: [], messages: [], partner_target: null };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockPoll), { status: 200 }));

    await pollState(BASE, 1, null);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/session/1/state/`);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'not found' }), { status: 404 }),
    );
    await expect(pollState(BASE, 99, null)).rejects.toThrow('not found');
  });
});

describe('endSession', () => {
  it('sends POST to end endpoint', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'completed' }), { status: 200 }));

    await endSession(BASE, 1);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/session/1/end/`, { method: 'POST' });
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'fail' }), { status: 400 }),
    );
    await expect(endSession(BASE, 1)).rejects.toThrow('fail');
  });
});
