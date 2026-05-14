import { describe, it, expect } from 'vitest';
import {
    angleToDirection, moveToward, pixelToTile, tileToPixel,
    createEngine, loadScene, handleClick,
} from '../map-engine.js';
import { SCENES, COLS, ROWS, TILE_SIZE, SCALE } from '../maps.js';

const PX = TILE_SIZE * SCALE;

describe('map-engine.js', () => {
    describe('angleToDirection', () => {
        it('returns 2 (East) for positive x, zero y', () => {
            expect(angleToDirection(10, 0)).toBe(2);
        });

        it('returns 6 (West) for negative x, zero y', () => {
            expect(angleToDirection(-10, 0)).toBe(6);
        });

        it('returns 4 (North) for zero x, negative y', () => {
            expect(angleToDirection(0, -10)).toBe(4);
        });

        it('returns 0 (South) for zero x, positive y', () => {
            expect(angleToDirection(0, 10)).toBe(0);
        });

        it('returns 0 (South) for no movement', () => {
            expect(angleToDirection(0, 0)).toBe(0);
        });
    });

    describe('moveToward', () => {
        it('moves toward target at given speed', () => {
            const result = moveToward(0, 0, 100, 0, 10);
            expect(result.x).toBeCloseTo(10);
            expect(result.y).toBeCloseTo(0);
            expect(result.arrived).toBe(false);
        });

        it('arrives when within speed distance', () => {
            const result = moveToward(95, 0, 100, 0, 10);
            expect(result.x).toBe(100);
            expect(result.y).toBe(0);
            expect(result.arrived).toBe(true);
        });

        it('handles diagonal movement', () => {
            const result = moveToward(0, 0, 10, 10, Math.SQRT2);
            expect(result.x).toBeCloseTo(1);
            expect(result.y).toBeCloseTo(1);
            expect(result.arrived).toBe(false);
        });
    });

    describe('pixelToTile / tileToPixel', () => {
        it('converts pixel center to correct tile', () => {
            const { tx, ty } = pixelToTile(PX * 3 + PX / 2, PX * 5 + PX / 2);
            expect(tx).toBe(3);
            expect(ty).toBe(5);
        });

        it('converts tile to pixel center', () => {
            const { px, py } = tileToPixel(3, 5);
            expect(px).toBe(3 * PX + PX / 2);
            expect(py).toBe(5 * PX + PX / 2);
        });

        it('round-trips correctly', () => {
            const { px, py } = tileToPixel(7, 12);
            const { tx, ty } = pixelToTile(px, py);
            expect(tx).toBe(7);
            expect(ty).toBe(12);
        });
    });

    describe('createEngine + loadScene', () => {
        it('creates engine with default state', () => {
            const engine = createEngine();
            expect(engine.currentScene).toBeNull();
            expect(engine.player.moving).toBe(false);
        });

        it('loads market scene with default spawn', () => {
            const engine = createEngine();
            loadScene(engine, 'market', null);
            expect(engine.currentScene.name).toBe('market');
            const expected = tileToPixel(SCENES.market.spawn.x, SCENES.market.spawn.y);
            expect(engine.player.x).toBe(expected.px);
            expect(engine.player.y).toBe(expected.py);
        });

        it('loads scene with edge spawn', () => {
            const engine = createEngine();
            loadScene(engine, 'home', 'east');
            expect(engine.currentScene.name).toBe('home');
            expect(engine.player.x).toBe(tileToPixel(COLS - 2, 7).px);
        });
    });

    describe('handleClick', () => {
        it('sets player target and moving state', () => {
            const engine = createEngine();
            loadScene(engine, 'market', null);
            const { px, py } = tileToPixel(5, 5);
            handleClick(engine, px, py);
            expect(engine.player.moving).toBe(true);
            expect(engine.player.targetX).toBe(px);
            expect(engine.player.targetY).toBe(py);
        });

        it('updates player direction toward click', () => {
            const engine = createEngine();
            loadScene(engine, 'market', null);
            // Click far to the east
            const { px, py } = tileToPixel(COLS - 2, Math.floor(ROWS / 2));
            handleClick(engine, px, py);
            // Direction should be roughly east (2)
            expect(engine.player.direction).toBe(2);
        });

        it('does nothing during transition', () => {
            const engine = createEngine();
            loadScene(engine, 'market', null);
            engine.transitioning = true;
            const origX = engine.player.targetX;
            handleClick(engine, 100, 100);
            expect(engine.player.targetX).toBe(origX);
        });
    });
});
