// Animated sprite widget for PMD sprites
import { spriteUrl, loadImage, fetchAnimData, calcFrameInfo } from './sprites.js';
const ACTIONS = ['Walk', 'Idle', 'Attack', 'Sleep'];
export const FRAME_MS = 150;
export const SCALE = 2;
let activeWidgets = [];
let animRunning = false;
export function getActiveWidgets() {
    return activeWidgets;
}
export function setActiveWidgets(widgets) {
    activeWidgets = widgets;
}
export function isAnimRunning() {
    return animRunning;
}
export function setAnimRunning(running) {
    animRunning = running;
}
export function resetWidgets() {
    activeWidgets = [];
    animRunning = false;
}
export function startAnimLoop() {
    if (animRunning)
        return;
    animRunning = true;
    let last = 0;
    function loop(ts) {
        if (activeWidgets.length === 0) {
            animRunning = false;
            return;
        }
        const now = performance.now();
        if (ts - last >= FRAME_MS) {
            last = ts;
            for (const w of activeWidgets) {
                const action = w.state === 'attacking' ? 'Attack' : 'Idle';
                const sheet = w.sheets[action] || w.sheets.Idle || w.sheets.Walk;
                const info = w.frameInfo[action] || w.frameInfo.Idle || w.frameInfo.Walk;
                if (!sheet || !info)
                    continue;
                // Resize canvas to match current action's frame dimensions
                if (w.canvas.width !== info.w * SCALE || w.canvas.height !== info.h * SCALE) {
                    w.canvas.width = info.w * SCALE;
                    w.canvas.height = info.h * SCALE;
                }
                const frameIdx = w.frame % info.count;
                w.ctx.clearRect(0, 0, w.canvas.width, w.canvas.height);
                w.ctx.imageSmoothingEnabled = false;
                w.ctx.drawImage(sheet, frameIdx * info.w, w.direction * info.h, info.w, info.h, 0, 0, info.w * SCALE, info.h * SCALE);
                w.frame++;
                if (w.state === 'attacking' && now > w.stateEnd) {
                    w.state = 'idle';
                    w.frame = 0;
                }
            }
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
export async function createSpriteWidget(dexId) {
    if (dexId <= 0)
        return null;
    const [animDims, walkImg, idleImg, attackImg, sleepImg] = await Promise.all([
        fetchAnimData(dexId),
        loadImage(spriteUrl(dexId, 'Walk')),
        loadImage(spriteUrl(dexId, 'Idle')),
        loadImage(spriteUrl(dexId, 'Attack')),
        loadImage(spriteUrl(dexId, 'Sleep')),
    ]);
    if (!walkImg && !idleImg)
        return null;
    const sheets = { Walk: walkImg, Idle: idleImg, Attack: attackImg, Sleep: sleepImg };
    const frameInfo = {
        Walk: walkImg ? calcFrameInfo(walkImg, animDims['Walk']) : null,
        Idle: idleImg ? calcFrameInfo(idleImg, animDims['Idle']) : null,
        Attack: attackImg ? calcFrameInfo(attackImg, animDims['Attack']) : null,
        Sleep: sleepImg ? calcFrameInfo(sleepImg, animDims['Sleep']) : null,
    };
    const info = frameInfo.Idle || frameInfo.Walk;
    const canvas = document.createElement('canvas');
    canvas.width = info.w * SCALE;
    canvas.height = info.h * SCALE;
    canvas.className = 'poke-sprite-canvas';
    const ctx = canvas.getContext('2d');
    const widget = {
        canvas, ctx, sheets, frameInfo,
        frame: 0, state: 'idle', stateEnd: 0, direction: 0,
    };
    canvas.addEventListener('click', () => {
        if (widget.sheets.Attack) {
            widget.state = 'attacking';
            widget.frame = 0;
            widget.stateEnd = performance.now() + 1000;
        }
    });
    activeWidgets.push(widget);
    startAnimLoop();
    return canvas;
}
//# sourceMappingURL=sprite-widget.js.map