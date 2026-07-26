/**
 * SHOP CATALOG (data-driven)
 * Add sets + products here. UI reads from this file.
 *
 * Image conventions (recommended):
 *  - Set image: /img/shop/<tcg>/<setSlug>/set.png
 *  - Product image: /img/shop/<tcg>/<setSlug>/<productSlug>.png
 */

export const PRODUCT_CATEGORIES = [
  "Sleeved Booster",
  "Booster Pack",
  "Booster Bundle",
  "Booster Box",
  "Single Checklane Blister",
  "2-Pack Checklane Blister",
  "3-Pack Blister",
  "Mini Tin",
  "Poster Collection",
  "Tech Sticker Collection",
  "ETB",
  "UPC",
  "SPC",
  "Figure Collection",
  "Premium Figure Collection",
  "Sealed Case",
];

export const SHOP_CATALOG = {
    pokemon: {
    label: "Pokémon",
    sets: [
      // Mega Evolution Series (new series)
      { name: "Mega Evolution—Perfect Order", setSlug: "mega-evolution-perfect-order", releaseDate: "2026-03-27", setImage: "/img/shop/pokemon/mega-evolution-perfect-order/set.png", products: [] },
      { name: "Mega Evolution—Ascended Heroes", setSlug: "mega-evolution-ascended-heroes", releaseDate: "2026-01-30", setImage: "/img/shop/pokemon/mega-evolution-ascended-heroes/set.png", products: [] },
      { name: "Mega Evolution—Phantasmal Flames", setSlug: "mega-evolution-phantasmal-flames", releaseDate: "2025-11-14", setImage: "/img/shop/pokemon/mega-evolution-phantasmal-flames/set.png", products: [] },
      { name: "Mega Evolution", setSlug: "mega-evolution", releaseDate: "2025-09-26", setImage: "/img/shop/pokemon/mega-evolution/set.png", products: [] },

      // Scarlet & Violet Series (newest → oldest)
      { name: "Scarlet & Violet—Black Bolt", setSlug: "sv-black-bolt", releaseDate: "2025-07-18", setImage: "/img/shop/pokemon/sv-black-bolt/set.png", products: [] },
      { name: "Scarlet & Violet—White Flare", setSlug: "sv-white-flare", releaseDate: "2025-07-18", setImage: "/img/shop/pokemon/sv-white-flare/set.png", products: [] },
      { name: "Scarlet & Violet—Destined Rivals", setSlug: "sv-destined-rivals", releaseDate: "2025-05-30", setImage: "/img/shop/pokemon/sv-destined-rivals/set.png", products: [] },
      { name: "Scarlet & Violet—Journey Together", setSlug: "sv-journey-together", releaseDate: "2025-03-28", setImage: "/img/shop/pokemon/sv-journey-together/set.png", products: [] },
      { name: "Scarlet & Violet—Prismatic Evolutions", setSlug: "sv-prismatic-evolutions", releaseDate: "2025-01-17", setImage: "/img/shop/pokemon/sv-prismatic-evolutions/set.png", products: [] },
      { name: "Scarlet & Violet—Surging Sparks", setSlug: "sv-surging-sparks", releaseDate: "2024-11-08", setImage: "/img/shop/pokemon/sv-surging-sparks/set.png", products: [] },
      { name: "Scarlet & Violet—Stellar Crown", setSlug: "sv-stellar-crown", releaseDate: "2024-09-13", setImage: "/img/shop/pokemon/sv-stellar-crown/set.png", products: [] },
      { name: "Scarlet & Violet—Shrouded Fable", setSlug: "sv-shrouded-fable", releaseDate: "2024-08-02", setImage: "/img/shop/pokemon/sv-shrouded-fable/set.png", products: [] },
      { name: "Scarlet & Violet—Twilight Masquerade", setSlug: "sv-twilight-masquerade", releaseDate: "2024-05-24", setImage: "/img/shop/pokemon/sv-twilight-masquerade/set.png", products: [] },
      { name: "Scarlet & Violet—Temporal Forces", setSlug: "sv-temporal-forces", releaseDate: "2024-03-22", setImage: "/img/shop/pokemon/sv-temporal-forces/set.png", products: [] },
      { name: "Scarlet & Violet—Paldean Fates", setSlug: "sv-paldean-fates", releaseDate: "2024-01-26", setImage: "/img/shop/pokemon/sv-paldean-fates/set.png", products: [] },
      { name: "Scarlet & Violet—Paradox Rift", setSlug: "sv-paradox-rift", releaseDate: "2023-11-03", setImage: "/img/shop/pokemon/sv-paradox-rift/set.png", products: [] },
      { name: "Scarlet & Violet 151", setSlug: "sv-151", releaseDate: "2023-09-22", setImage: "/img/shop/pokemon/sv-151/set.png", products: [] },
      { name: "Scarlet & Violet—Obsidian Flames", setSlug: "sv-obsidian-flames", releaseDate: "2023-08-11", setImage: "/img/shop/pokemon/sv-obsidian-flames/set.png", products: [] },
      { name: "Scarlet & Violet—Paldea Evolved", setSlug: "sv-paldea-evolved", releaseDate: "2023-06-09", setImage: "/img/shop/pokemon/sv-paldea-evolved/set.png", products: [] },
      { name: "Scarlet & Violet", setSlug: "sv-base", releaseDate: "2023-03-31", setImage: "/img/shop/pokemon/sv-base/set.png", products: [] },

      // One extra era (Sword & Shield) — sets list only for now
      { name: "Crown Zenith", setSlug: "swsh-crown-zenith", releaseDate: "2023-01-20", setImage: "/img/shop/pokemon/swsh-crown-zenith/set.png", products: [] },
      { name: "Silver Tempest", setSlug: "swsh-silver-tempest", releaseDate: "2022-11-11", setImage: "/img/shop/pokemon/swsh-silver-tempest/set.png", products: [] },
      { name: "Lost Origin", setSlug: "swsh-lost-origin", releaseDate: "2022-09-09", setImage: "/img/shop/pokemon/swsh-lost-origin/set.png", products: [] },
      { name: "Pokémon GO", setSlug: "swsh-pokemon-go", releaseDate: "2022-07-01", setImage: "/img/shop/pokemon/swsh-pokemon-go/set.png", products: [] },
      { name: "Astral Radiance", setSlug: "swsh-astral-radiance", releaseDate: "2022-05-27", setImage: "/img/shop/pokemon/swsh-astral-radiance/set.png", products: [] },
      { name: "Brilliant Stars", setSlug: "swsh-brilliant-stars", releaseDate: "2022-02-25", setImage: "/img/shop/pokemon/swsh-brilliant-stars/set.png", products: [] },
      { name: "Fusion Strike", setSlug: "swsh-fusion-strike", releaseDate: "2021-11-12", setImage: "/img/shop/pokemon/swsh-fusion-strike/set.png", products: [] },
      { name: "Celebrations", setSlug: "swsh-celebrations", releaseDate: "2021-10-08", setImage: "/img/shop/pokemon/swsh-celebrations/set.png", products: [] },
      { name: "Evolving Skies", setSlug: "swsh-evolving-skies", releaseDate: "2021-08-27", setImage: "/img/shop/pokemon/swsh-evolving-skies/set.png", products: [] },
      { name: "Chilling Reign", setSlug: "swsh-chilling-reign", releaseDate: "2021-06-18", setImage: "/img/shop/pokemon/swsh-chilling-reign/set.png", products: [] },
      { name: "Battle Styles", setSlug: "swsh-battle-styles", releaseDate: "2021-03-19", setImage: "/img/shop/pokemon/swsh-battle-styles/set.png", products: [] },
      { name: "Shining Fates", setSlug: "swsh-shining-fates", releaseDate: "2021-02-19", setImage: "/img/shop/pokemon/swsh-shining-fates/set.png", products: [] },
      { name: "Vivid Voltage", setSlug: "swsh-vivid-voltage", releaseDate: "2020-11-13", setImage: "/img/shop/pokemon/swsh-vivid-voltage/set.png", products: [] },
      { name: "Champion's Path", setSlug: "swsh-champions-path", releaseDate: "2020-09-25", setImage: "/img/shop/pokemon/swsh-champions-path/set.png", products: [] },
      { name: "Darkness Ablaze", setSlug: "swsh-darkness-ablaze", releaseDate: "2020-08-14", setImage: "/img/shop/pokemon/swsh-darkness-ablaze/set.png", products: [] },
      { name: "Rebel Clash", setSlug: "swsh-rebel-clash", releaseDate: "2020-05-01", setImage: "/img/shop/pokemon/swsh-rebel-clash/set.png", products: [] },
      { name: "Sword & Shield", setSlug: "swsh-base", releaseDate: "2020-02-07", setImage: "/img/shop/pokemon/swsh-base/set.png", products: [] },
    ],
  },
onepiece: {
    label: "One Piece",
    sets: [
      // SAMPLE
      {
        name: "OP — Example Set",
        setSlug: "op-example-set",
        releaseDate: "2026-01-01",
        setImage: "/img/shop/onepiece/op-example-set/set.png",
        products: [
          { title: "Booster Box", productSlug: "booster-box", category: "Booster Box", price: "$—", image: "/img/shop/onepiece/op-example-set/booster-box.png" },
        ],
      },
    ],
  },

  mtg: {
    label: "MTG",
    sets: [
      // SAMPLE
      {
        name: "MTG — Example Set",
        setSlug: "mtg-example-set",
        releaseDate: "2026-01-01",
        setImage: "/img/shop/mtg/mtg-example-set/set.png",
        products: [
          { title: "Collector Booster Pack", productSlug: "collector-pack", category: "Booster Pack", price: "$—", image: "/img/shop/mtg/mtg-example-set/collector-pack.png" },
        ],
      },
    ],
  },

  other: {
    label: "Other TCGs",
    sets: [
      // Add Lorcana / Digimon / Weiss / etc later
    ],
  },
};


