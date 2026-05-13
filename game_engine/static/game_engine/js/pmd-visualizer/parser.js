// PokePaste parser and related types
export function parsePokepaste(text) {
    const blocks = text.trim().split(/\n\n+/);
    return blocks.map(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0)
            return null;
        const firstLine = lines[0];
        const atSplit = firstLine.split('@');
        const item = atSplit[1]?.trim() || '';
        const nameRaw = atSplit[0].trim();
        const species = nameRaw.replace(/\s*\([MF]\)\s*/, '').trim();
        let ability = '', level = '', nature = '', evs = '';
        const moves = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('Ability:'))
                ability = line.replace('Ability:', '').trim();
            else if (line.startsWith('Level:'))
                level = line.replace('Level:', '').trim();
            else if (line.startsWith('EVs:'))
                evs = line.replace('EVs:', '').trim();
            else if (line.endsWith('Nature'))
                nature = line.replace('Nature', '').trim();
            else if (line.startsWith('-'))
                moves.push(line.replace('-', '').trim());
        }
        return { species, item, ability, level, nature, evs, moves };
    }).filter(Boolean);
}
//# sourceMappingURL=parser.js.map