// LocalStorage save/load for teams
const STORAGE_KEY = 'pokepaste-saved-teams';
export function loadSavedTeams() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }
    catch {
        return [];
    }
}
export function saveSavedTeams(teams) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}
export function getNextTeamNumber() {
    return loadSavedTeams().length + 1;
}
//# sourceMappingURL=storage.js.map