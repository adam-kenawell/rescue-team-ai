// Chat state logic — message merging, slash commands, input locking

import type { ChatMessage } from './types.js';

/** Known slash commands */
const SLASH_COMMANDS = new Set(['rest']);

/**
 * Parse a slash command from user input.
 * Returns the command name (e.g. 'rest') or null if not a valid slash command.
 */
export function parseSlashCommand(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const command = trimmed.slice(1).toLowerCase();
  return SLASH_COMMANDS.has(command) ? command : null;
}

/**
 * Merge incoming messages into existing array, deduplicating by id.
 * Returns the same reference if nothing new was added.
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((m) => m.id));
  const newMsgs = incoming.filter((m) => !seen.has(m.id));
  if (newMsgs.length === 0) return existing;
  return [...existing, ...newMsgs];
}

/**
 * Whether the chat input should be locked (disabled).
 * Locked when waiting for a response or session is no longer active.
 */
export function isInputLocked(sessionStatus: string, waitingForResponse: boolean): boolean {
  if (sessionStatus !== 'active') return true;
  return waitingForResponse;
}

/** Max consecutive poll failures before giving up */
export const MAX_POLL_FAILURES = 3;

/**
 * Track consecutive poll failures. Returns the new count and whether
 * the connection should be considered lost.
 */
export function trackPollFailure(consecutiveFailures: number): { count: number; connectionLost: boolean } {
  const count = consecutiveFailures + 1;
  return { count, connectionLost: count >= MAX_POLL_FAILURES };
}

/** Reset failure count on a successful poll. */
export function resetPollFailures(): { count: number; connectionLost: boolean } {
  return { count: 0, connectionLost: false };
}
