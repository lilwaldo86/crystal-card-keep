import generatedCatalog from "./generatedCatalog.json" with { type: "json" };

const group = (label, sets) => ({ label, sets: sets.map(([code, name]) => ({ code, name, kinds: ["sealed", "singles"] })) });

export const SHOP_GAMES = [
  { key: "pokemon", label: "Pokémon", path: "/shop/pokemon" },
  { key: "onepiece", label: "One Piece", path: "/shop/one-piece" },
  { key: "mtg", label: "MTG", path: "/shop/mtg" },
  { key: "fusionworld", label: "DB Fusion World", path: "/shop/fusion-world" },
  { key: "masters", label: "DB Masters", path: "/shop/masters" },
  { key: "gundam", label: "Gundam", path: "/shop/gundam" },
];

const CURATED_GROUPS = {
  pokemon: [
    group("Mega Evolution", [["MEG", "Mega Evolution"], ["PFL", "Phantasmal Flames"], ["ASC", "Ascended Heroes"], ["POR", "Perfect Order"], ["CHR", "Chaos Rising"], ["PBL", "Pitch Black"], ["30A", "30th Anniversary"]]),
    group("Scarlet & Violet", [["SVI", "Scarlet & Violet"], ["PAL", "Paldea Evolved"], ["OBF", "Obsidian Flames"], ["MEW", "151"], ["PAR", "Paradox Rift"], ["PAF", "Paldean Fates"], ["TEF", "Temporal Forces"], ["TWM", "Twilight Masquerade"], ["SFA", "Shrouded Fable"], ["SCR", "Stellar Crown"], ["SSP", "Surging Sparks"], ["PRE", "Prismatic Evolutions"], ["JTG", "Journey Together"], ["DRI", "Destined Rivals"], ["BLK", "Black Bolt"], ["WHT", "White Flare"]]),
    group("Sword & Shield", [["SSH", "Sword & Shield"], ["RCL", "Rebel Clash"], ["DAA", "Darkness Ablaze"], ["CPA", "Champion’s Path"], ["VIV", "Vivid Voltage"], ["SHF", "Shining Fates"], ["BST", "Battle Styles"], ["CRE", "Chilling Reign"], ["EVS", "Evolving Skies"], ["CEL", "Celebrations"], ["FST", "Fusion Strike"], ["BRS", "Brilliant Stars"], ["ASR", "Astral Radiance"], ["PGO", "Pokémon GO"], ["LOR", "Lost Origin"], ["SIT", "Silver Tempest"], ["CRZ", "Crown Zenith"]]),
    group("Sun & Moon", [["SUM", "Sun & Moon"], ["GRI", "Guardians Rising"], ["BUS", "Burning Shadows"], ["SLG", "Shining Legends"], ["CIN", "Crimson Invasion"], ["UPR", "Ultra Prism"], ["FLI", "Forbidden Light"], ["CES", "Celestial Storm"], ["DRM", "Dragon Majesty"], ["LOT", "Lost Thunder"], ["TEU", "Team Up"], ["DET", "Detective Pikachu"], ["UNB", "Unbroken Bonds"], ["UNM", "Unified Minds"], ["HIF", "Hidden Fates"], ["CEC", "Cosmic Eclipse"]]),
    group("XY", [["XY", "XY"], ["FLF", "Flashfire"], ["FFI", "Furious Fists"], ["PHF", "Phantom Forces"], ["PRC", "Primal Clash"], ["DCR", "Double Crisis"], ["ROS", "Roaring Skies"], ["AOR", "Ancient Origins"], ["BKT", "BREAKthrough"], ["BKP", "BREAKpoint"], ["GEN", "Generations"], ["FCO", "Fates Collide"], ["STS", "Steam Siege"], ["EVO", "Evolutions"]]),
    group("Black & White", [["BLW", "Black & White"], ["EPO", "Emerging Powers"], ["NVI", "Noble Victories"], ["NXD", "Next Destinies"], ["DEX", "Dark Explorers"], ["DRX", "Dragons Exalted"], ["DRV", "Dragon Vault"], ["BCR", "Boundaries Crossed"], ["PLS", "Plasma Storm"], ["PLF", "Plasma Freeze"], ["PLB", "Plasma Blast"], ["LTR", "Legendary Treasures"]]),
    group("HeartGold & SoulSilver", [["HS", "HeartGold & SoulSilver"], ["UL", "Unleashed"], ["UD", "Undaunted"], ["TM", "Triumphant"], ["CL", "Call of Legends"]]),
    group("Platinum", [["PL", "Platinum"], ["RR", "Rising Rivals"], ["SV", "Supreme Victors"], ["AR", "Arceus"]]),
    group("Diamond & Pearl", [["DP", "Diamond & Pearl"], ["MT", "Mysterious Treasures"], ["SW", "Secret Wonders"], ["GE", "Great Encounters"], ["MD", "Majestic Dawn"], ["LA", "Legends Awakened"], ["SF", "Stormfront"]]),
    group("EX Series", [["RS", "Ruby & Sapphire"], ["SS", "Sandstorm"], ["DR", "Dragon"], ["MA", "Team Magma vs Team Aqua"], ["HL", "Hidden Legends"], ["FRLG", "FireRed & LeafGreen"], ["TRR", "Team Rocket Returns"], ["DX", "Deoxys"], ["EM", "Emerald"], ["UF", "Unseen Forces"], ["DS", "Delta Species"], ["LM", "Legend Maker"], ["HP", "Holon Phantoms"], ["CG", "Crystal Guardians"], ["DF", "Dragon Frontiers"], ["PK", "Power Keepers"]]),
    group("e-Card & Neo", [["EX", "Expedition Base Set"], ["AQ", "Aquapolis"], ["SK", "Skyridge"], ["N1", "Neo Genesis"], ["N2", "Neo Discovery"], ["N3", "Neo Revelation"], ["N4", "Neo Destiny"], ["LC", "Legendary Collection"]]),
    group("Original Series", [["BS", "Base Set"], ["JU", "Jungle"], ["FO", "Fossil"], ["B2", "Base Set 2"], ["TR", "Team Rocket"], ["G1", "Gym Heroes"], ["G2", "Gym Challenge"]]),
  ],
  onepiece: [
    group("Main Boosters", [["OP-01", "Romance Dawn"], ["OP-02", "Paramount War"], ["OP-03", "Pillars of Strength"], ["OP-04", "Kingdoms of Intrigue"], ["OP-05", "Awakening of the New Era"], ["OP-06", "Wings of the Captain"], ["OP-07", "500 Years in the Future"], ["OP-08", "Two Legends"], ["OP-09", "Emperors in the New World"], ["OP-10", "Royal Blood"], ["OP-11", "A Fist of Divine Speed"], ["OP-12", "Legacy of the Master"], ["OP-13", "Carrying On His Will"], ["OP14-EB04", "The Azure Sea’s Seven"], ["OP-16", "The Time of Battle"]]),
    group("Extra Boosters", [["EB-01", "Memorial Collection"], ["EB-02", "Anime 25th Collection"], ["EB-03", "One Piece Heroines Edition"], ["EB-04", "The Azure Sea’s Seven"]]),
    group("Premium Boosters", [["PRB-01", "One Piece Card The Best"], ["PRB-02", "One Piece Card The Best Vol. 2"]]),
  ],
  mtg: [
    group("2026", [["ECL", "Lorwyn Eclipsed"], ["TMT", "Teenage Mutant Ninja Turtles"], ["HOB", "The Hobbit"], ["MSH", "Marvel Super Heroes"]]),
    group("2025", [["DFT", "Aetherdrift"], ["TDM", "Tarkir: Dragonstorm"], ["FIN", "Final Fantasy"], ["EOE", "Edge of Eternities"], ["SPM", "Marvel’s Spider-Man"], ["TLA", "Avatar: The Last Airbender"]]),
    group("2024", [["MKM", "Murders at Karlov Manor"], ["OTJ", "Outlaws of Thunder Junction"], ["MH3", "Modern Horizons 3"], ["BLB", "Bloomburrow"], ["DSK", "Duskmourn: House of Horror"], ["FDN", "Foundations"]]),
    group("2023", [["ONE", "Phyrexia: All Will Be One"], ["MOM", "March of the Machine"], ["MAT", "March of the Machine: The Aftermath"], ["LTR", "The Lord of the Rings: Tales of Middle-earth"], ["WOE", "Wilds of Eldraine"], ["LCI", "The Lost Caverns of Ixalan"]]),
    group("2022", [["NEO", "Kamigawa: Neon Dynasty"], ["SNC", "Streets of New Capenna"], ["CLB", "Commander Legends: Battle for Baldur’s Gate"], ["DMU", "Dominaria United"], ["BRO", "The Brothers’ War"]]),
    group("2021", [["KHM", "Kaldheim"], ["STX", "Strixhaven: School of Mages"], ["MH2", "Modern Horizons 2"], ["AFR", "Adventures in the Forgotten Realms"], ["MID", "Innistrad: Midnight Hunt"], ["VOW", "Innistrad: Crimson Vow"]]),
    group("2020", [["THB", "Theros Beyond Death"], ["IKO", "Ikoria: Lair of Behemoths"], ["M21", "Core Set 2021"], ["ZNR", "Zendikar Rising"]]),
    group("Classic & Legacy", [["LEA", "Limited Edition Alpha"], ["LEB", "Limited Edition Beta"], ["2ED", "Unlimited Edition"], ["ARN", "Arabian Nights"], ["ATQ", "Antiquities"], ["LEG", "Legends"], ["DRK", "The Dark"], ["FEM", "Fallen Empires"], ["ICE", "Ice Age"], ["HML", "Homelands"], ["ALL", "Alliances"], ["MIR", "Mirage"], ["TMP", "Tempest"], ["USG", "Urza’s Saga"], ["MMQ", "Mercadian Masques"], ["INV", "Invasion"], ["ODY", "Odyssey"], ["ONS", "Onslaught"], ["MRD", "Mirrodin"], ["CHK", "Champions of Kamigawa"], ["RAV", "Ravnica: City of Guilds"], ["TSP", "Time Spiral"], ["LRW", "Lorwyn"], ["ALA", "Shards of Alara"], ["ZEN", "Zendikar"], ["SOM", "Scars of Mirrodin"], ["ISD", "Innistrad"], ["RTR", "Return to Ravnica"], ["THS", "Theros"], ["KTK", "Khans of Tarkir"], ["BFZ", "Battle for Zendikar"], ["SOI", "Shadows over Innistrad"], ["KLD", "Kaladesh"], ["AKH", "Amonkhet"], ["XLN", "Ixalan"], ["DOM", "Dominaria"], ["GRN", "Guilds of Ravnica"], ["WAR", "War of the Spark"], ["ELD", "Throne of Eldraine"]]),
  ],
  fusionworld: [
    group("Booster Sets", [["FB01", "Awakened Pulse"], ["FB02", "Blazing Aura"], ["FB03", "Raging Roar"], ["FB04", "Ultra Limit"], ["FB05", "New Adventure"], ["FB06", "Rivals Clash"], ["FB07", "Wish for Shenron"], ["FB08", "Saiyan’s Pride"], ["FB09", "Dual Evolution"], ["FB10", "Cross Force"], ["FB11", "Brightness of Hope"], ["FB12", "Reach the God"]]),
    group("Special Boosters", [["SB01", "Manga Booster 01"], ["SB02", "Manga Booster 02"], ["ST01", "Story Booster 01"]]),
  ],
  masters: [
    group("Main Booster Series", [["BT1", "Galactic Battle"], ["BT2", "Union Force"], ["BT3", "Cross Worlds"], ["BT4", "Colossal Warfare"], ["BT5", "Miraculous Revival"], ["BT6", "Destroyer Kings"], ["BT7", "Assault of the Saiyans"], ["BT8", "Malicious Machinations"], ["BT9", "Universal Onslaught"], ["BT10", "Rise of the Unison Warrior"], ["BT11", "Vermilion Bloodline"], ["BT12", "Vicious Rejuvenation"], ["BT13", "Supreme Rivalry"], ["BT14", "Cross Spirits"], ["BT15", "Saiyan Showdown"], ["BT16", "Realm of the Gods"], ["BT17", "Ultimate Squad"], ["BT18", "Dawn of the Z-Legends"], ["BT19", "Fighter’s Ambition"], ["BT20", "Power Absorbed"], ["BT21", "Wild Resurgence"], ["BT22", "Critical Blow"], ["BT23", "Perfect Combination"], ["BT24", "Beyond Generations"], ["BT25", "Legend of the Dragon Balls"], ["BT26", "Ultimate Advent"], ["DBS-B30", "Three Glorious Fighters"], ["DBS-B31", "Impact Beyond Dimensions"], ["DBS-B32", "Chromatic Ascension"]]),
    group("Themed & Reprint Boosters", [["TB1", "The Tournament of Power"], ["TB2", "World Martial Arts Tournament"], ["TB3", "Clash of Fates"], ["MB-01", "Mythic Booster"]]),
  ],
  gundam: [
    group("Booster Sets", [["GD01", "Newtype Rising"], ["GD02", "Dual Impact"], ["GD03", "Steel Requiem"], ["GD04", "Phantom Aria"], ["EB01", "Eternal Nexus"], ["GD05", "Freedom Ascension"], ["GD06", "Stardust Trails"], ["GD07", "Blazing Fist"]]),
  ],
};

function mergeGroups(curated, generated = []) {
  const result = curated.map((entry) => ({ ...entry, sets: [...entry.sets] }));
  const seen = new Set(result.flatMap((entry) => entry.sets.map((set) => `${set.code}:${set.name}`.toLowerCase())));
  for (const incoming of generated) {
    let target = result.find((entry) => entry.label === incoming.label);
    if (!target) {
      target = { label: incoming.label, sets: [] };
      result.unshift(target);
    }
    for (const set of incoming.sets || []) {
      const identity = `${set.code}:${set.name}`.toLowerCase();
      if (!seen.has(identity)) {
        target.sets.push({ ...set, kinds: set.kinds?.length ? set.kinds : ["sealed", "singles"] });
        seen.add(identity);
      }
    }
  }
  return result;
}

export const SHOP_GROUPS = Object.fromEntries(
  Object.entries(CURATED_GROUPS).map(([game, groups]) => [game, mergeGroups(groups, generatedCatalog.games?.[game])]),
);
