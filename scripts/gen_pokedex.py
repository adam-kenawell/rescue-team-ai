"""Generate shared/pokedex.json from PokeAPI."""
import json
import urllib.request

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "rescue-team-ai/1.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def main():
    pokedex = {}

    # Fetch all in one request
    url = "https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0"
    print("Fetching all Pokemon from PokeAPI...")
    data = fetch_json(url)
    total = data["count"]
    print(f"Total: {total}")

    for entry in data["results"]:
        name = entry["name"]
        dex_id = int(entry["url"].rstrip("/").split("/")[-1])
        pokedex[name] = dex_id

    # Sort by dex ID
    pokedex = dict(sorted(pokedex.items(), key=lambda x: x[1]))

    out_path = "shared/pokedex.json"
    with open(out_path, "w") as f:
        json.dump(pokedex, f, indent=2)
    print(f"Wrote {len(pokedex)} entries to {out_path}")

if __name__ == "__main__":
    main()
