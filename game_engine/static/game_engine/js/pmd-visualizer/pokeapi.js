// PokeAPI data fetching utilities
const pokeDataCache = {};
const moveDataCache = {};
const FORM_MAP = {
    'rotom-frost': 'rotom-frost',
    'arcanine-hisui': 'arcanine-hisui',
    'basculegion': 'basculegion-male',
    'froslass-mega': 'froslass',
};
export async function fetchPokemonData(species) {
    let slug = species.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const lookup = FORM_MAP[slug] || slug;
    if (pokeDataCache[lookup])
        return pokeDataCache[lookup];
    try {
        let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${lookup}`);
        if (!res.ok) {
            const base = slug.split('-')[0];
            res = await fetch(`https://pokeapi.co/api/v2/pokemon/${base}`);
            if (!res.ok)
                return null;
        }
        const data = await res.json();
        pokeDataCache[lookup] = data;
        return data;
    }
    catch {
        return null;
    }
}
export async function nameToDexId(species) {
    const data = await fetchPokemonData(species);
    return data?.id || 0;
}
export async function fetchMoveType(moveName) {
    const slug = moveName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (moveDataCache[slug])
        return moveDataCache[slug];
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
        if (!res.ok)
            return 'normal';
        const data = await res.json();
        const type = data.type?.name || 'normal';
        moveDataCache[slug] = type;
        return type;
    }
    catch {
        return 'normal';
    }
}
//# sourceMappingURL=pokeapi.js.map