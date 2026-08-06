import { normalizePageUrl } from './pagination';

describe('normalizePageUrl', () => {
  it('converts absolute pagination URLs to relative paths', () => {
    expect(normalizePageUrl('http://127.0.0.1:8000/api/quotes/?page=2')).toBe('/api/quotes/?page=2');
  });

  it('keeps existing relative pagination URLs unchanged', () => {
    expect(normalizePageUrl('/api/quotes/?page=3')).toBe('/api/quotes/?page=3');
  });
});
