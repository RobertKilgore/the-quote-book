import { sortQuotes } from './sortQuotes';

describe('sortQuotes', () => {
  it('orders quotes by rarity in descending order', () => {
    const quotes = [
      { id: 1, rank: 'common' },
      { id: 2, rank: 'legendary' },
      { id: 3, rank: 'rare' },
    ];

    expect(sortQuotes(quotes, 'rarity', 'desc').map(q => q.id)).toEqual([2, 3, 1]);
  });

  it('normalizes rarity values regardless of casing', () => {
    const quotes = [
      { id: 1, rank: 'Common' },
      { id: 2, rank: 'LEGENDARY' },
      { id: 3, rank: 'Rare' },
    ];

    expect(sortQuotes(quotes, 'rarity', 'asc').map(q => q.id)).toEqual([1, 3, 2]);
  });
});
