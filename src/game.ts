export type CardData = {
  id: string
  value: string
  type: 'number' | 'phone' | 'text'
}

export type GamePhase =
  | 'preview'
  | 'flipping'
  | 'shuffling'
  | 'select-base'
  | 'eliminate'
  | 'revealing'
  | 'decision'
  | 'final'
  | 'result'

export const INITIAL_CARDS: CardData[] = [
  { id: 'card-1', value: '1', type: 'number' },
  { id: 'card-50', value: '50', type: 'number' },
  { id: 'card-10', value: '10', type: 'number' },
  { id: 'card-520', value: '520', type: 'number' },
  { id: 'card-1314', value: '1314', type: 'number' },
  { id: 'card-200', value: '200', type: 'number' },
  { id: 'card-88', value: '88', type: 'number' },
  { id: 'card-5', value: '5', type: 'number' },
  { id: 'card-phone', value: 'iPhone18Pro', type: 'phone' },
]

export function inferCardType(value: string): CardData['type'] {
  return /^-?\d+(\.\d+)?$/.test(value.trim()) ? 'number' : 'text'
}

export function shuffleCards(cards: CardData[], random: () => number = Math.random): CardData[] {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

export function getRemainingCards(deck: CardData[], baseId: string | null, excludedIds: string[]) {
  const excluded = new Set(excludedIds)
  return deck.filter((card) => card.id === baseId || !excluded.has(card.id))
}

export function getOtherRemainingCard(deck: CardData[], baseId: string | null, excludedIds: string[]) {
  return getRemainingCards(deck, baseId, excludedIds).find((card) => card.id !== baseId) ?? null
}
