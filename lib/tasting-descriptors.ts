export const TASTING_DESCRIPTORS = [
  'vanilla', 'caramel', 'toffee', 'butterscotch', 'honey', 'maple syrup',
  'oak', 'charred oak', 'toasted oak', 'cedar', 'sandalwood',
  'dark chocolate', 'cocoa', 'coffee', 'espresso',
  'dried fruit', 'raisin', 'fig', 'date', 'prune',
  'apple', 'pear', 'apricot', 'peach', 'cherry', 'orange peel',
  'cinnamon', 'clove', 'nutmeg', 'allspice', 'black pepper', 'baking spice',
  'tobacco', 'leather', 'earth', 'mineral',
  'smoke', 'peat', 'bonfire', 'campfire',
  'floral', 'rose', 'violet', 'lavender',
  'mint', 'eucalyptus', 'herbal',
  'corn sweetness', 'rye spice', 'malt', 'biscuit',
  'cream', 'butter', 'milk chocolate',
  'molasses', 'brown sugar', 'demerara',
  'almond', 'walnut', 'pecan', 'hazelnut',
  'citrus', 'lemon', 'lime', 'grapefruit',
  'sherry', 'port', 'wine cask',
  'astringent', 'tannic', 'dry', 'long finish', 'short finish', 'warm finish',
] as const

export type TastingDescriptor = typeof TASTING_DESCRIPTORS[number]

export function scoreCategory(score: number): string {
  if (score >= 95) return 'Exceptional'
  if (score >= 85) return 'Excellent'
  if (score >= 75) return 'Very Good'
  if (score >= 60) return 'Good'
  return 'Developing'
}
