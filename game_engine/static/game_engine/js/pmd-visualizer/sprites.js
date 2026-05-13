// Shared sprite utilities for PMD sprite rendering
export function spriteUrl(id, action) {
    return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/${String(id).padStart(4, '0')}/${action}-Anim.png`;
}
export function animDataUrl(id) {
    return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/${String(id).padStart(4, '0')}/AnimData.xml`;
}
export function loadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}
export async function fetchAnimData(id) {
    try {
        const res = await fetch(animDataUrl(id));
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, 'text/xml');
        const anims = doc.querySelectorAll('Anim');
        const result = {};
        anims.forEach((anim) => {
            const name = anim.querySelector('Name')?.textContent ?? '';
            const w = parseInt(anim.querySelector('FrameWidth')?.textContent ?? '0', 10);
            const h = parseInt(anim.querySelector('FrameHeight')?.textContent ?? '0', 10);
            if (name && w > 0 && h > 0)
                result[name] = { w, h };
        });
        return result;
    }
    catch {
        return {};
    }
}
export function calcFrameInfo(img, dims) {
    if (dims && dims.w > 0 && dims.h > 0) {
        return { w: dims.w, h: dims.h, count: Math.max(1, Math.floor(img.naturalWidth / dims.w)) };
    }
    const h = Math.floor(img.naturalHeight / 8);
    return { w: h, h, count: Math.max(1, Math.floor(img.naturalWidth / h)) };
}
//# sourceMappingURL=sprites.js.map