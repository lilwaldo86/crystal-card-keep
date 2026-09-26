import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = path.join(root, "src", "data", "product-media");
const games = ["pokemon", "onepiece", "mtg", "fusionworld", "masters", "gundam"];
let total = 0;

for (const game of games) {
  const snapshot = JSON.parse(await fs.readFile(path.join(mediaRoot, `${game}.json`), "utf8"));
  if (snapshot.schemaVersion !== 1 || snapshot.gameKey !== game) throw new Error(`${game}: invalid snapshot metadata`);
  const ids = new Set();
  for (const product of snapshot.products) {
    if (!product.externalProductId || ids.has(product.externalProductId)) throw new Error(`${game}: missing or duplicate product ID`);
    if (!product.productName || !product.setName || !["SEALED", "SINGLE", "OTHER"].includes(product.itemType)) throw new Error(`${game}: invalid product record ${product.externalProductId}`);
    if (product.thumbnailUrl && !/^https:\/\//.test(product.thumbnailUrl)) throw new Error(`${game}: insecure thumbnail URL ${product.externalProductId}`);
    ids.add(product.externalProductId);
  }
  total += snapshot.products.length;
  console.log(`${game}: ${snapshot.groups.length} sets, ${snapshot.products.length} products, ${snapshot.products.filter((item) => item.thumbnailUrl).length} thumbnails`);
}

console.log(`Product media verification passed: ${total} products.`);

