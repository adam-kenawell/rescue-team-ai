// Sprite layer tests — direction calculation, agent state management

import { describe, it, expect } from 'vitest';
import {
  directionFromDelta,
  type AgentSpriteState,
  type AgentStatus,
  createAgentSpriteState,
  updateAgentStates,
  DIRECTION_ROWS,
} from '../sprites.js';

describe('directionFromDelta', () => {
  it('returns Down (0) for straight down movement', () => {
    expect(directionFromDelta(0, 10)).toBe(DIRECTION_ROWS.Down);
  });

  it('returns Up (4) for straight up movement', () => {
    expect(directionFromDelta(0, -10)).toBe(DIRECTION_ROWS.Up);
  });

  it('returns Right (6) for straight right movement', () => {
    expect(directionFromDelta(10, 0)).toBe(DIRECTION_ROWS.Right);
  });

  it('returns Left (2) for straight left movement', () => {
    expect(directionFromDelta(-10, 0)).toBe(DIRECTION_ROWS.Left);
  });

  it('returns DownRight (7) for diagonal down-right', () => {
    expect(directionFromDelta(10, 10)).toBe(DIRECTION_ROWS.DownRight);
  });

  it('returns DownLeft (1) for diagonal down-left', () => {
    expect(directionFromDelta(-10, 10)).toBe(DIRECTION_ROWS.DownLeft);
  });

  it('returns UpRight (5) for diagonal up-right', () => {
    expect(directionFromDelta(10, -10)).toBe(DIRECTION_ROWS.UpRight);
  });

  it('returns UpLeft (3) for diagonal up-left', () => {
    expect(directionFromDelta(-10, -10)).toBe(DIRECTION_ROWS.UpLeft);
  });

  it('returns Down (0) for zero delta (idle facing)', () => {
    expect(directionFromDelta(0, 0)).toBe(DIRECTION_ROWS.Down);
  });
});

describe('createAgentSpriteState', () => {
  it('creates state with correct defaults', () => {
    const state = createAgentSpriteState('wigglytuff', 40);
    expect(state.pokemon).toBe('wigglytuff');
    expect(state.dexId).toBe(40);
    expect(state.action).toBe('Idle');
    expect(state.status).toBe('sleeping');
    expect(state.frame).toBe(0);
    expect(state.direction).toBe(0);
    expect(state.isPartner).toBe(false);
  });

  it('creates partner state', () => {
    const state = createAgentSpriteState('charmander', 4, true);
    expect(state.isPartner).toBe(true);
  });
});

describe('updateAgentStates', () => {
  function makeStates(): Map<string, AgentSpriteState> {
    const map = new Map<string, AgentSpriteState>();
    map.set('kecleon', createAgentSpriteState('kecleon', 352));
    map.set('electivire', createAgentSpriteState('electivire', 466));
    return map;
  }

  it('transitions sleeping → Sleep action', () => {
    const states = makeStates();
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'kecleon', status: 'sleeping' },
      { pokemon: 'electivire', status: 'sleeping' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('kecleon')!.action).toBe('Sleep');
  });

  it('transitions awake → Idle action', () => {
    const states = makeStates();
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'kecleon', status: 'awake' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('kecleon')!.action).toBe('Idle');
    expect(states.get('kecleon')!.status).toBe('awake');
  });

  it('transitions thinking → Walk action', () => {
    const states = makeStates();
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'electivire', status: 'thinking' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('electivire')!.action).toBe('Walk');
    expect(states.get('electivire')!.status).toBe('thinking');
  });

  it('transitions done → Idle action', () => {
    const states = makeStates();
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'kecleon', status: 'done' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('kecleon')!.action).toBe('Idle');
  });

  it('resets frame counter on action change', () => {
    const states = makeStates();
    states.get('kecleon')!.frame = 5;
    states.get('kecleon')!.action = 'Idle';
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'kecleon', status: 'thinking' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('kecleon')!.frame).toBe(0);
  });

  it('does not reset frame if action unchanged', () => {
    const states = makeStates();
    states.get('kecleon')!.frame = 5;
    states.get('kecleon')!.action = 'Idle';
    states.get('kecleon')!.status = 'awake';
    const poll: { pokemon: string; status: AgentStatus }[] = [
      { pokemon: 'kecleon', status: 'awake' },
    ];
    updateAgentStates(states, poll);
    expect(states.get('kecleon')!.frame).toBe(5);
  });
});
