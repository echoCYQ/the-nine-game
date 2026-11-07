import { describe, expect, it } from 'vitest'
import { INITIAL_CARDS, getOtherRemainingCard, getRemainingCards, inferCardType, shuffleCards } from './game'

describe('game rules', () => {
  it('contains exactly the nine requested values', () => {
    expect(INITIAL_CARDS.map((card) => card.value)).toEqual([
      '1', '50', '10', '520', '1314', '200', '88', '5', 'iPhone18Pro',
    ])
  })

  it('shuffles without losing or duplicating cards', () => {
    const values = [0.2, 0.8, 0.1, 0.6, 0.4, 0.9, 0.3, 0.7]
    let index = 0
    const shuffled = shuffleCards(INITIAL_CARDS, () => values[index++])
    expect(shuffled).toHaveLength(9)
    expect(new Set(shuffled.map((card) => card.id))).toEqual(new Set(INITIAL_CARDS.map((card) => card.id)))
    expect(shuffled.map((card) => card.id)).not.toEqual(INITIAL_CARDS.map((card) => card.id))
  })

  it('keeps the base and last unknown card for the final choice', () => {
    const baseId = INITIAL_CARDS[0].id
    const excludedIds = INITIAL_CARDS.slice(1, 8).map((card) => card.id)
    const remaining = getRemainingCards(INITIAL_CARDS, baseId, excludedIds)
    expect(remaining.map((card) => card.id)).toEqual([baseId, INITIAL_CARDS[8].id])
    expect(getOtherRemainingCard(INITIAL_CARDS, baseId, excludedIds)?.id).toBe(INITIAL_CARDS[8].id)
  })

  it('infers edited numeric and custom text card types', () => {
    expect(inferCardType('888')).toBe('number')
    expect(inferCardType('3.14')).toBe('number')
    expect(inferCardType('幸运大奖')).toBe('text')
    expect(inferCardType('iPhone18Pro')).toBe('text')
  })
})
