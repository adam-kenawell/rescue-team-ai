import { describe, it, expect } from 'vitest';
import {
  parseSlashCommand,
  mergeMessages,
  isInputLocked,
} from '../state.js';
import type { ChatMessage } from '../types.js';

describe('parseSlashCommand', () => {
  it('returns "rest" for /rest', () => {
    expect(parseSlashCommand('/rest')).toBe('rest');
  });

  it('returns "rest" for /rest with whitespace', () => {
    expect(parseSlashCommand('  /rest  ')).toBe('rest');
  });

  it('returns null for normal messages', () => {
    expect(parseSlashCommand('hello world')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSlashCommand('')).toBeNull();
  });

  it('returns null for unknown slash commands', () => {
    expect(parseSlashCommand('/unknown')).toBeNull();
  });

  it('returns null for slash in middle of message', () => {
    expect(parseSlashCommand('let us /rest now')).toBeNull();
  });
});

describe('mergeMessages', () => {
  const existing: ChatMessage[] = [
    { id: 1, role: 'user', content: 'hello', agent: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 2, role: 'orchestrator', content: 'hi', agent: 'pikachu', created_at: '2026-01-01T00:00:01Z' },
  ];

  it('appends new messages by id', () => {
    const incoming: ChatMessage[] = [
      { id: 3, role: 'agent', content: 'done', agent: 'kecleon', created_at: '2026-01-01T00:00:02Z' },
    ];
    const result = mergeMessages(existing, incoming);
    expect(result).toHaveLength(3);
    expect(result[2].id).toBe(3);
  });

  it('does not duplicate existing messages', () => {
    const incoming: ChatMessage[] = [
      { id: 2, role: 'orchestrator', content: 'hi', agent: 'pikachu', created_at: '2026-01-01T00:00:01Z' },
      { id: 3, role: 'agent', content: 'done', agent: 'kecleon', created_at: '2026-01-01T00:00:02Z' },
    ];
    const result = mergeMessages(existing, incoming);
    expect(result).toHaveLength(3);
  });

  it('returns existing array unchanged when no new messages', () => {
    const result = mergeMessages(existing, []);
    expect(result).toBe(existing);
  });

  it('handles empty existing array', () => {
    const incoming: ChatMessage[] = [
      { id: 1, role: 'user', content: 'first', agent: null, created_at: '2026-01-01T00:00:00Z' },
    ];
    const result = mergeMessages([], incoming);
    expect(result).toHaveLength(1);
  });
});

describe('isInputLocked', () => {
  it('returns false when session is active and not waiting', () => {
    expect(isInputLocked('active', false)).toBe(false);
  });

  it('returns true when waiting for response', () => {
    expect(isInputLocked('active', true)).toBe(true);
  });

  it('returns true when session is completed', () => {
    expect(isInputLocked('completed', false)).toBe(true);
  });

  it('returns true when session is completed and waiting', () => {
    expect(isInputLocked('completed', true)).toBe(true);
  });
});
