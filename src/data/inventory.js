// src/data/inventory.js

export const TCGS = [
  'Pokémon',
  'One Piece',
  'Magic: The Gathering',
  'Gundam',
  'Dragon Ball Z',
  'Sports Cards'
]

// Determines if an item is sealed product
export function isSealed(item) {
  return item.type === 'sealed'
}

// Badge label for UI
export function badgeForType(item) {
  if (item.type === 'sealed') return 'Sealed'
  if (item.type === 'single') return 'Single'
  return 'Other'
}

// Group inventory by set name
export function groupBySet(items) {
  return items.reduce((acc, item) => {
    const key = item.set || 'Misc'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

// INVENTORY DATA (starter / placeholder)
export const INVENTORY = [
  {
    id: 'pkm-001',
    name: 'Scarlet & Violet Booster Box',
    tcg: 'Pokémon',
    set: 'Scarlet & Violet',
    type: 'sealed',
    price: 119.99,
    quantity: 12
  },
  {
    id: 'pkm-002',
    name: 'Charizard ex',
    tcg: 'Pokémon',
    set: 'Obsidian Flames',
    type: 'single',
    variant: 'Holo',
    price: 24.95,
    quantity: 1
  },
  {
    id: 'op-001',
    name: 'OP-05 Booster Box',
    tcg: 'One Piece',
    set: 'Awakening of the New Era',
    type: 'sealed',
    price: 139.99,
    quantity: 6
  },
  {
    id: 'mtg-001',
    name: 'Collector Booster Pack',
    tcg: 'Magic: The Gathering',
    set: 'Modern Horizons 3',
    type: 'sealed',
    price: 34.99,
    quantity: 18
  }
]
