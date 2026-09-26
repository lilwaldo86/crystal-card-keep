import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "src", "data", "product-media");
const requested = process.argv.find((value) => value.startsWith("--game="))?.split("=")[1];
const endpoint = process.env.CATALOG_SYNC_ENDPOINT?.replace(/\/$/, "");
const token = process.env.ADMIN_TOKEN;
const headers = { Accept: "application/json", "User-Agent": "CrystalCardKeepCatalog/1.0" };

const games = {
  mtg: { categoryId: 1, label: "Magic: The Gathering" },
  pokemon: { categoryId: 3, label: "Pokémon" },
  masters: { categoryId: 27, label: "Dragon Ball Super: Masters" },
  onepiece: { categoryId: 68, label: "One Piece" },
  fusionworld: { categoryId: 80, label: "Dragon Ball Super: Fusion World" },
  gundam: { categoryId: 86, label: "Gundam" },
};

const selected = requested ? [[requested, games[requested]]] : Object.entries(games);
if (selected.some(([, config]) => !config)) throw new Error(`Unknown --game value. Use: ${Object.keys(games).join(", ")}`);

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalize = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sealedPattern = /\b(booster (box|pack|case|bundle)|display|starter deck|structure deck|theme deck|collection|elite trainer box|etb|tin|blister|bundle|gift set|deck box|playmat|sleeves|case of)\b/i;

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function upload(gameKey, groups, products) {
  if (!endpoint || !token) return;
  for (let index = 0; index < products.length; index += 500) {
    const response = await fetch(`${endpoint}/api/admin/catalog/products/import`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ gameKey, groups: index === 0 ? groups : [], products: products.slice(index, index + 500) }),
    });
    if (!response.ok) throw new Error(`Catalog upload failed: ${response.status} ${await response.text()}`);
  }
}

await fs.mkdir(outputRoot, { recursive: true });
for (const [gameKey, config] of selected) {
  const groupPayload = await getJson(`https://tcgcsv.com/tcgplayer/${config.categoryId}/groups`);
  const groups = groupPayload.results.map((group) => ({
    provider: "tcgcsv-tcgplayer", externalGroupId: String(group.groupId), gameKey,
    setCode: group.abbreviation || null, setName: group.name,
    releaseDate: group.publishedOn || null, sourceModifiedAt: group.modifiedOn || null,
  }));
  const products = [];
  for (const [index, group] of groupPayload.results.entries()) {
    const payload = await getJson(`https://tcgcsv.com/tcgplayer/${config.categoryId}/${group.groupId}/products`);
    for (const product of payload.results ?? []) {
      const extended = Object.fromEntries((product.extendedData ?? []).map((field) => [normalize(field.name), field.value]));
      products.push({
        provider: "tcgcsv-tcgplayer", externalProductId: String(product.productId), externalGroupId: String(group.groupId),
        gameKey, setCode: group.abbreviation || null, setName: group.name, productName: product.name,
        cleanName: product.cleanName || null, itemType: sealedPattern.test(product.name) ? "SEALED" : "SINGLE",
        collectorNumber: extended.number || extended["card number"] || null, thumbnailUrl: product.imageUrl || null,
        productUrl: product.url || null, imageCount: Number(product.imageCount || 0), sourceModifiedAt: product.modifiedOn || null,
      });
    }
    if ((index + 1) % 25 === 0) console.log(`${gameKey}: ${index + 1}/${groupPayload.results.length} sets`);
    await pause(110);
  }
  const snapshot = {
    schemaVersion: 1, provider: "TCGCSV cached TCGplayer catalog", providerUrl: "https://tcgcsv.com/docs",
    usageNote: "Catalog metadata cache. Review upstream image/content terms before production display or redistribution.",
    generatedAt: new Date().toISOString(), gameKey, label: config.label, categoryId: config.categoryId, groups, products,
  };
  const target = path.join(outputRoot, `${gameKey}.json`);
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(snapshot)}\n`, "utf8");
  await fs.rename(temporary, target);
  await upload(gameKey, groups, products);
  console.log(`${gameKey}: saved ${groups.length} sets and ${products.length} product thumbnails`);
}

if (endpoint && !token) console.warn("CATALOG_SYNC_ENDPOINT was set without ADMIN_TOKEN; snapshots were saved but not uploaded.");
