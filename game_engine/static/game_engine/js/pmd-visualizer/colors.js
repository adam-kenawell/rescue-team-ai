// Type color maps and EV color utilities
export const TYPE_COLORS = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
    grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
    ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
    steel: '#B8B8D0', fairy: '#EE99AC',
};
export const EV_COLORS = {
    'hp': '#ff4d4d',
    'atk': '#ff9933',
    'def': '#f5d000',
    'spa': '#4d9fff',
    'spd': '#4dcc73',
    'spe': '#ff66b2',
};
export function colorizeEvs(evStr) {
    const statMap = {
        'hp': 'hp', 'atk': 'atk', 'attack': 'atk', 'def': 'def', 'defense': 'def',
        'spa': 'spa', 'spatk': 'spa', 'spd': 'spd', 'spdef': 'spd',
        'spe': 'spe', 'speed': 'spe',
    };
    return evStr.split('/').map(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/(\d+)\s+(.+)/);
        if (!match)
            return trimmed;
        const [, num, statName] = match;
        const key = statName.toLowerCase().replace(/[^a-z]/g, '');
        const mapped = statMap[key] || key;
        const color = EV_COLORS[mapped] || 'rgba(255,255,255,0.65)';
        return `<span style="color:${color}">${num} ${statName}</span>`;
    }).join(' / ');
}
export function getTypeGradient(types) {
    if (types.length === 1)
        return TYPE_COLORS[types[0]] || '#A8A878';
    const c1 = TYPE_COLORS[types[0]] || '#A8A878';
    const c2 = TYPE_COLORS[types[1]] || '#A8A878';
    return `linear-gradient(135deg, ${c1}, ${c2})`;
}
//# sourceMappingURL=colors.js.map