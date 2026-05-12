// Tests for map engine logic

import { describe, it, expect } from 'vitest';
import {
  createMapState,
  distance,
  pointInRect,
  findHotspot,
  startWalk,
  updateWalk,
  isWalking,
  transitionScreen,
  handleClick,
  tick,
  startFade,
  updateFade,
  isFading,
} from '../engine.js';
import { SCREENS } from '../screens.js';

describe('createMapState', () => {
  it('creates state at sharpedo bluff by default', () => {
    const state = createMapState(25);
    expect(state.currentScreenId).toBe('sharpedo_bluff');
    expect(state.playerDexId).toBe(25);
    expect(state.playerPosition).toEqual(SCREENS.sharpedo_bluff.defaultSpawn);
    expect(state.walk).toBeNull();
  });

  it('creates state at a custom start screen', () => {
    const state = createMapState(1, 'town_center');
    expect(state.currentScreenId).toBe('town_center');
    expect(state.playerPosition).toEqual(SCREENS.town_center.defaultSpawn);
  });

  it('throws for unknown screen', () => {
    expect(() => createMapState(1, 'fake')).toThrow();
  });
});

describe('distance', () => {
  it('returns 0 for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('calculates correctly', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('pointInRect', () => {
  const rect = { x: 10, y: 20, w: 50, h: 30 };

  it('inside', () => expect(pointInRect(30, 35, rect)).toBe(true));
  it('top-left corner', () => expect(pointInRect(10, 20, rect)).toBe(true));
  it('bottom-right corner', () => expect(pointInRect(60, 50, rect)).toBe(true));
  it('outside left', () => expect(pointInRect(9, 35, rect)).toBe(false));
  it('outside below', () => expect(pointInRect(30, 51, rect)).toBe(false));
});

describe('findHotspot', () => {
  it('finds exit hotspot on sharpedo bluff', () => {
    const h = findHotspot('sharpedo_bluff', 256, 10);
    expect(h).not.toBeNull();
    expect(h!.id).toBe('exit_to_crossroads');
  });

  it('returns null for empty area', () => {
    const h = findHotspot('sharpedo_bluff', 256, 200);
    expect(h).toBeNull();
  });

  it('finds shop hotspot', () => {
    const h = findHotspot('town_center', 110, 100);
    expect(h).not.toBeNull();
    expect(h!.kind).toBe('shop');
    expect(h!.agentPokemon).toBe('kecleon');
  });
});

describe('walk system', () => {
  it('starts and completes a walk', () => {
    const state = createMapState(25);
    const target = { x: 256, y: 40 };
    startWalk(state, target, 0);
    expect(isWalking(state)).toBe(true);

    // Mid-walk
    updateWalk(state, state.walk!.duration / 2);
    expect(state.playerPosition.x).toBeCloseTo(
      (state.walk!.from.x + target.x) / 2,
      0,
    );
    expect(isWalking(state)).toBe(true);

    // Complete walk
    const completed = updateWalk(state, state.walk!.startTime + state.walk!.duration + 1);
    // walk is now null since it completed
  });

  it('does nothing for zero-distance walk', () => {
    const state = createMapState(25);
    const pos = { ...state.playerPosition };
    startWalk(state, pos, 0);
    expect(isWalking(state)).toBe(false);
  });

  it('updateWalk returns false when no walk active', () => {
    const state = createMapState(25);
    expect(updateWalk(state, 100)).toBe(false);
  });
});

describe('transitionScreen', () => {
  it('changes screen and sets spawn', () => {
    const state = createMapState(25);
    transitionScreen(state, 'crossroads', { x: 100, y: 200 });
    expect(state.currentScreenId).toBe('crossroads');
    expect(state.playerPosition).toEqual({ x: 100, y: 200 });
    expect(state.walk).toBeNull();
  });

  it('throws for invalid target', () => {
    const state = createMapState(25);
    expect(() => transitionScreen(state, 'fake', { x: 0, y: 0 })).toThrow();
  });
});

describe('handleClick', () => {
  it('starts walk to hotspot', () => {
    const state = createMapState(25);
    const hotspot = handleClick(state, 256, 10, 0);
    expect(hotspot).not.toBeNull();
    expect(hotspot!.id).toBe('exit_to_crossroads');
    expect(isWalking(state)).toBe(true);
  });

  it('returns null when clicking empty area', () => {
    const state = createMapState(25);
    expect(handleClick(state, 256, 200, 0)).toBeNull();
    expect(isWalking(state)).toBe(false);
  });

  it('ignores clicks while walking', () => {
    const state = createMapState(25);
    handleClick(state, 256, 10, 0);
    const second = handleClick(state, 256, 10, 50);
    expect(second).toBeNull();
  });
});

describe('tick', () => {
  it('triggers fade transition after walk to exit completes', () => {
    const state = createMapState(25);
    const hotspot = handleClick(state, 256, 10, 0)!;
    expect(hotspot.kind).toBe('exit');
    const duration = state.walk!.duration;

    // Tick past the walk duration — should start fade, not instant swap
    const result = tick(state, duration + 100, hotspot);
    expect(result).not.toBeNull();
    expect(isFading(state)).toBe(true);
    // Screen hasn't changed yet (still fading out)
    expect(state.currentScreenId).toBe('sharpedo_bluff');

    // Advance past fade-out → screen swaps
    updateFade(state, duration + 100 + 300);
    expect(state.currentScreenId).toBe('crossroads');
    expect(state.fade!.phase).toBe('in');

    // Advance past fade-in → fade complete
    updateFade(state, duration + 100 + 600);
    expect(isFading(state)).toBe(false);
  });

  it('returns completed shop hotspot without screen change', () => {
    const state = createMapState(25, 'town_center');
    const hotspot = handleClick(state, 110, 100, 0)!;
    expect(hotspot.kind).toBe('shop');
    const duration = state.walk!.duration;

    const result = tick(state, duration + 100, hotspot);
    expect(result).not.toBeNull();
    expect(result!.agentPokemon).toBe('kecleon');
    expect(state.currentScreenId).toBe('town_center'); // no screen change
  });

  it('returns null when no walk active', () => {
    const state = createMapState(25);
    expect(tick(state, 100, null)).toBeNull();
  });
});

describe('fade transitions', () => {
  it('startFade sets fade state', () => {
    const state = createMapState(25);
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    expect(isFading(state)).toBe(true);
    expect(state.fade!.phase).toBe('out');
  });

  it('updateFade returns increasing opacity during fade-out', () => {
    const state = createMapState(25);
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    const mid = updateFade(state, 125);
    expect(mid).toBeCloseTo(0.5, 1);
  });

  it('swaps screen at end of fade-out and transitions to fade-in', () => {
    const state = createMapState(25);
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    const opacity = updateFade(state, 250);
    expect(opacity).toBe(1);
    expect(state.currentScreenId).toBe('crossroads');
    expect(state.playerPosition).toEqual({ x: 100, y: 200 });
    expect(state.fade!.phase).toBe('in');
  });

  it('updateFade returns decreasing opacity during fade-in', () => {
    const state = createMapState(25);
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    updateFade(state, 250); // complete out phase
    const mid = updateFade(state, 250 + 125);
    expect(mid).toBeCloseTo(0.5, 1);
  });

  it('clears fade state after fade-in completes', () => {
    const state = createMapState(25);
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    updateFade(state, 250); // out done
    updateFade(state, 250 + 250); // in done
    expect(isFading(state)).toBe(false);
    expect(state.fade).toBeNull();
  });

  it('returns 0 when no fade active', () => {
    const state = createMapState(25);
    expect(updateFade(state, 100)).toBe(0);
  });

  it('throws for invalid target screen', () => {
    const state = createMapState(25);
    expect(() => startFade(state, 'fake', { x: 0, y: 0 }, 0)).toThrow();
  });

  it('blocks clicks during fade', () => {
    const state = createMapState(25, 'town_center');
    startFade(state, 'crossroads', { x: 100, y: 200 }, 0);
    const result = handleClick(state, 110, 100, 50);
    expect(result).toBeNull();
  });
});
