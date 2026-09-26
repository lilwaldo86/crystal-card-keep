import { SHOP_GAMES, SHOP_GROUPS } from "../src/data/shopGroups.js";

const required = ["pokemon", "onepiece", "mtg", "fusionworld", "masters", "gundam"];
for (const key of required) {
  if (!SHOP_GAMES.some((game) => game.key === key)) throw new Error(`Missing game tab: ${key}`);
  if (!SHOP_GROUPS[key]?.length) throw new Error(`Missing catalog groups: ${key}`);
  const rows = SHOP_GROUPS[key].flatMap((group) => group.sets);
  if (!rows.length) throw new Error(`Empty catalog: ${key}`);
  for (const row of rows) {
    if (!row.code || !row.name) throw new Error(`Incomplete set in ${key}`);
    if (!row.kinds.includes("sealed") || !row.kinds.includes("singles")) throw new Error(`Missing catalog modes: ${key}/${row.code}`);
  }
  console.log(`${key}: ${rows.length} sets in ${SHOP_GROUPS[key].length} groups`);
}
console.log("Expanded shop catalog verification passed.");
