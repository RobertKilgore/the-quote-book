import { normalizeListResponse } from './normalizeListResponse';

describe('normalizeListResponse', () => {
  it('returns arrays unchanged', () => {
    const data = [{ id: 1 }];
    expect(normalizeListResponse(data)).toEqual(data);
  });

  it('extracts results from paginated objects', () => {
    expect(normalizeListResponse({ results: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it('falls back to an empty array for unsupported payloads', () => {
    expect(normalizeListResponse({ count: 1 })).toEqual([]);
  });
});
