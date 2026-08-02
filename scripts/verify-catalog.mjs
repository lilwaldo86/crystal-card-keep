import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_SETS,
  SHOP_DATA,
} from "../src/data/catalog.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  CANONICAL_SETS.length === 43,
  `Expected 43 canonical sets; found ${CANONICAL_SETS.length}.`
);

const expectedCounts = {
  pokemon: 37,
  onepiece: 3,
  mtg: 3,
};

for (const [gameKey, expected] of Object.entries(expectedCounts)) {
  const count = CANONICAL_SETS.filter(
    (set) => set.gameKey === gameKey
  ).length;

  assert(
    count === expected,
    `Expected ${expected} ${gameKey} sets; found ${count}.`
  );
}

const idPattern = /^set_[0-9a-f]{32}$/;
const ids = new Set();
const migrationKeys = new Set();

for (const set of CANONICAL_SETS) {
  assert(idPattern.test(set.id), `Invalid permanent ID: ${set.id}`);
  assert(!ids.has(set.id), `Duplicate permanent ID: ${set.id}`);
  ids.add(set.id);

  assert(set.canonicalName?.trim(), `Missing name for ${set.id}`);
  assert(set.gameKey in expectedCounts, `Invalid game: ${set.gameKey}`);
  assert(set.route?.startsWith("/shop/"), `Invalid route: ${set.id}`);
  assert(Array.isArray(set.aliases), `Aliases missing: ${set.id}`);

  const migrationKey =
    `${set.gameKey}:${set.legacySourceKey}`;

  assert(
    !migrationKeys.has(migrationKey),
    `Duplicate migration key: ${migrationKey}`
  );

  migrationKeys.add(migrationKey);

  assert(
    !/example set|booster box|collector booster pack/i.test(
      set.canonicalName
    ),
    `Placeholder record found: ${set.canonicalName}`
  );
}

const visibleCounts = {
  pokemon: SHOP_DATA.pokemon.sets.length,
  onepiece: SHOP_DATA.onepiece.sets.length,
  mtg: SHOP_DATA.mtg.sets.length,
};

for (const [gameKey, count] of Object.entries(visibleCounts)) {
  assert(
    count === 3,
    `Expected 3 visible ${gameKey} sets; found ${count}.`
  );
}

assert(
  SHOP_DATA.other.sets.length === 0,
  "Other TCG storefront group must remain empty."
);

const visibleNames = Object.values(SHOP_DATA)
  .flatMap((game) => game.sets)
  .map((set) => set.name);

const expectedVisible = [
  "Perfect Order",
  "Ascended Heroes",
  "Phantasmal Flames",
  "One Piece Heroines Edition",
  "The Azure Sea's Seven",
  "Carrying On His Will",
  "TMNT",
  "Lorwyn Eclipsed",
  "Avatar: The Last Airbender",
];

for (const name of expectedVisible) {
  assert(
    visibleNames.includes(name),
    `Required visible set missing: ${name}`
  );
}

const shopSource = fs.readFileSync(
  path.join(root, "src", "pages", "Shop.jsx"),
  "utf8"
);

assert(
  shopSource.includes(
    'import { SHOP_DATA as DATA } from "../data/catalog.js";'
  ),
  "Shop does not import the canonical catalog."
);

assert(
  !shopSource.includes("const DATA = {"),
  "Embedded Shop DATA still exists."
);

assert(
  !shopSource.includes("shopCatalog"),
  "Shop still depends on shopCatalog.js."
);

console.log("Catalog verification passed.");
console.log("Canonical sets: 43");
console.log("Pokemon: 37");
console.log("One Piece: 3");
console.log("MTG: 3");
console.log("Visible storefront sets: 9");
console.log("Permanent set IDs: valid and unique");
console.log("Placeholder sets/products: excluded");
