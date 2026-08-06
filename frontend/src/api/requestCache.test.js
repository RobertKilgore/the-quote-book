import { invalidateRequestCacheEntries } from './requestCache';

describe('invalidateRequestCacheEntries', () => {
  it('removes cache entries whose keys match the provided URL prefix', () => {
    const cache = new Map([
      ['get:/api/quotes/7/:', { data: { id: 7 } }],
      ['get:/api/users/:', { data: [] }],
      ['get:/api/quotes/8/:', { data: { id: 8 } }],
    ]);

    invalidateRequestCacheEntries(cache, '/api/quotes/');

    expect(Array.from(cache.keys())).toEqual(['get:/api/users/:']);
  });

  it('clears everything when no prefix is provided', () => {
    const cache = new Map([['get:/api/quotes/7/:', { data: { id: 7 } }]]);

    invalidateRequestCacheEntries(cache);

    expect(cache.size).toBe(0);
  });
});
