// Map engine -- renders tile map + player sprite on a shared canvas.
// Pure logic is exported for testing; DOM/canvas coupling is in init().

import { TILE_SIZE, SCALE, COLS, ROWS, TILE_COLORS, SCENES, getExitAtTile, getEdgeSpawn } from './maps.js';
import { spriteUrl, loadImage, fetchAnimData, calcFrameInfo } from './pmd-visualizer/sprites.js';

const PX = TILE_SIZE * SCALE; // rendered pixel size per tile

// --- Direction mapping (PMD spritesheet row order) ---
// 0=South, 1=SE, 2=East, 3=NE, 4=North, 5=NW, 6=West, 7=SW
export function angleToDirection(dx, dy) {
    if (dx === 0 && dy === 0) return 0; // default south
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Map angle to 8-dir PMD index
    if (angle >= -22.5 && angle < 22.5) return 2;   // East
    if (angle >= 22.5 && angle < 67.5) return 1;     // SE
    if (angle >= 67.5 && angle < 112.5) return 0;    // South
    if (angle >= 112.5 && angle < 157.5) return 7;   // SW
    if (angle >= 157.5 || angle < -157.5) return 6;  // West
    if (angle >= -157.5 && angle < -112.5) return 5;  // NW
    if (angle >= -112.5 && angle < -67.5) return 4;   // North
    if (angle >= -67.5 && angle < -22.5) return 3;    // NE
    return 0;
}

/**
 * Compute the next position along a straight line toward a target.
 * Returns { x, y, arrived } in pixel coords.
 */
export function moveToward(cx, cy, tx, ty, speed) {
    const dx = tx - cx;
    const dy = ty - cy;
    const dist = Math.hypot(dx, dy);
    if (dist <= speed) return { x: tx, y: ty, arrived: true };
    const ratio = speed / dist;
    return { x: cx + dx * ratio, y: cy + dy * ratio, arrived: false };
}

/**
 * Convert pixel position to tile coordinate.
 */
export function pixelToTile(px, py) {
    return { tx: Math.floor(px / PX), ty: Math.floor(py / PX) };
}

/**
 * Convert tile coordinate to pixel center.
 */
export function tileToPixel(tx, ty) {
    return { px: tx * PX + PX / 2, py: ty * PX + PX / 2 };
}

// --- Engine state (created per init call) ---

export function createEngine() {
    return {
        canvas: null,
        ctx: null,
        overlay: null,          // fade overlay element
        currentScene: null,
        player: { x: 0, y: 0, targetX: 0, targetY: 0, moving: false, direction: 0 },
        sprites: { Walk: null, Idle: null },
        frameInfo: { Walk: null, Idle: null },
        frame: 0,
        transitioning: false,
        speed: 2.5,             // pixels per frame
        dexId: 25,              // default Pikachu
        onSceneChange: null,    // callback for tests
    };
}

// --- Sprite loading ---

export async function loadPlayerSprite(engine, dexId) {
    engine.dexId = dexId;
    const [animDims, walkImg, idleImg] = await Promise.all([
        fetchAnimData(dexId),
        loadImage(spriteUrl(dexId, 'Walk')),
        loadImage(spriteUrl(dexId, 'Idle')),
    ]);
    engine.sprites.Walk = walkImg;
    engine.sprites.Idle = idleImg;
    engine.frameInfo.Walk = walkImg ? calcFrameInfo(walkImg, animDims['Walk']) : null;
    engine.frameInfo.Idle = idleImg ? calcFrameInfo(idleImg, animDims['Idle']) : null;
}

// --- Scene management ---

export function loadScene(engine, sceneName, spawnEdge) {
    const scene = SCENES[sceneName];
    if (!scene) return;
    engine.currentScene = scene;
    const spawn = spawnEdge ? getEdgeSpawn(scene, spawnEdge) : scene.spawn;
    const { px, py } = tileToPixel(spawn.x, spawn.y);
    engine.player.x = px;
    engine.player.y = py;
    engine.player.targetX = px;
    engine.player.targetY = py;
    engine.player.moving = false;
    engine.player.direction = 0;
    engine.transitioning = false;
    if (engine.onSceneChange) engine.onSceneChange(sceneName);
}

// --- Rendering ---

export function drawTiles(engine) {
    const { ctx, currentScene } = engine;
    if (!currentScene) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = currentScene.grid[r][c];
            ctx.fillStyle = TILE_COLORS[tile] || TILE_COLORS[0];
            ctx.fillRect(c * PX, r * PX, PX, PX);
        }
    }
}

export function drawPlayer(engine) {
    const { ctx, player, sprites, frameInfo, frame } = engine;
    const action = player.moving ? 'Walk' : 'Idle';
    const sheet = sprites[action] || sprites.Idle;
    const info = frameInfo[action] || frameInfo.Idle;
    if (!sheet || !info) return;

    const frameIdx = frame % info.count;
    const drawW = info.w * SCALE;
    const drawH = info.h * SCALE;
    const dx = player.x - drawW / 2;
    const dy = player.y - drawH / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        sheet,
        frameIdx * info.w, player.direction * info.h, info.w, info.h,
        dx, dy, drawW, drawH,
    );
}

// --- Fade transition ---

function fadeOut(overlay, duration = 500) {
    return new Promise(resolve => {
        overlay.style.transition = `opacity ${duration}ms ease`;
        overlay.style.opacity = '1';
        setTimeout(resolve, duration);
    });
}

function fadeIn(overlay, duration = 500) {
    return new Promise(resolve => {
        overlay.style.transition = `opacity ${duration}ms ease`;
        overlay.style.opacity = '0';
        setTimeout(resolve, duration);
    });
}

export async function transitionToScene(engine, exit) {
    if (engine.transitioning) return;
    engine.transitioning = true;
    if (engine.overlay) await fadeOut(engine.overlay);
    loadScene(engine, exit.target, exit.spawnEdge);
    if (engine.overlay) await fadeIn(engine.overlay);
    engine.transitioning = false;
}

// --- Game loop ---

const FRAME_MS = 60; // ~16fps walk animation tick

export function tick(engine) {
    const { player } = engine;
    if (player.moving && !engine.transitioning) {
        const result = moveToward(player.x, player.y, player.targetX, player.targetY, engine.speed);
        player.x = result.x;
        player.y = result.y;
        if (result.arrived) {
            player.moving = false;
            // Check exit zone
            const { tx, ty } = pixelToTile(player.x, player.y);
            const exit = getExitAtTile(engine.currentScene, tx, ty);
            if (exit) transitionToScene(engine, exit);
        }
    }
}

export function render(engine) {
    const { ctx } = engine;
    ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
    drawTiles(engine);
    drawPlayer(engine);
}

export function startLoop(engine) {
    let lastFrame = 0;
    function loop(ts) {
        tick(engine);
        render(engine);
        // Animate sprite frames at walk speed
        if (ts - lastFrame >= FRAME_MS) {
            engine.frame++;
            lastFrame = ts;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// --- Click handler ---

export function handleClick(engine, canvasX, canvasY) {
    if (engine.transitioning) return;
    const { tx, ty } = pixelToTile(canvasX, canvasY);

    // Clicked an exit tile? Walk toward it (transition triggers on arrival).
    // Clicked a normal tile? Walk there.
    const { px, py } = tileToPixel(tx, ty);
    const dx = px - engine.player.x;
    const dy = py - engine.player.y;
    engine.player.direction = angleToDirection(dx, dy);
    engine.player.targetX = px;
    engine.player.targetY = py;
    engine.player.moving = true;
}

// --- DOM init (the only function that touches the real DOM) ---

export function init(engine, canvas, overlay) {
    engine.canvas = canvas;
    engine.ctx = canvas.getContext('2d');
    engine.overlay = overlay;
    canvas.width = COLS * PX;
    canvas.height = ROWS * PX;

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        handleClick(engine, x, y);
    });
}
