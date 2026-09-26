import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "src", "data", "generatedCatalog.json");
const headers = { Accept: "application/json", "User-Agent": "CrystalCardKeepCatalog/1.0" };

async function json(url, extraHeaders = {}) {
  const response = await fetch(url, { headers: { ...headers, ...extraHeaders } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function grouped(records, labelFor) {
  const buckets = new Map();
  for (const record of records) {
    const label = labelFor(record);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push({ code: record.code, name: record.name, kinds: ["sealed", "singles"], releaseDate: record.releaseDate || null, sourceId: record.sourceId });
  }
  return [...buckets].map(([label, sets]) => ({ label, sets }));
}

async function syncPokemon() {
  const key = process.env.POKEMON_TCG_API_KEY;
  const payload = await json("https://api.pokemontcg.io/v2/sets?pageSize=250", key ? { "X-Api-Key": key } : {});
  const records = payload.data.map((set) => ({ code: String(set.ptcgoCode || set.id).toUpperCase(), name: set.name, releaseDate: set.releaseDate, sourceId: set.id, series: set.series || "Other Pokémon Sets" })).sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)));
  return grouped(records, (set) => set.series);
}

async function syncMtg() {
  const payload = await json("https://api.scryfall.com/sets");
  const allowed = new Set(["core", "expansion", "masters", "draft_innovation", "commander"]);
  const records = payload.data.filter((set) => !set.digital && allowed.has(set.set_type) && set.released_at).map((set) => ({ code: set.code.toUpperCase(), name: set.name, releaseDate: set.released_at, sourceId: set.id }));
  return grouped(records, (set) => String(set.releaseDate).slice(0, 4));
}

const previous = JSON.parse(await fs.readFile(output, "utf8"));
const next = { generatedAt: new Date().toISOString(), sources: { ...(previous.sources || {}) }, games: { ...(previous.games || {}) } };

for (const [game, sync] of [["pokemon", syncPokemon], ["mtg", syncMtg]]) {
  try {
    next.games[game] = await sync();
    next.sources[game] = { status: "ok", syncedAt: next.generatedAt };
  } catch (error) {
    next.sources[game] = { status: "preserved_previous_snapshot", syncedAt: next.generatedAt, error: String(error).slice(0, 240) };
  }
}

await fs.writeFile(output, `${JSON.stringify(next, null, 2)}\n`, "utf8");
console.log(`Catalog snapshot written to ${output}`);
for (const [game, groups] of Object.entries(next.games)) console.log(`${game}: ${groups.flatMap((entry) => entry.sets).length} external sets`);
