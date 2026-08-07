import { formatCountdown, getCountdownText } from './countdown';

describe('formatCountdown', () => {
  it('formats an upcoming deadline into a readable countdown', () => {
    const now = new Date('2026-08-06T12:00:00Z').getTime();
    const deadline = new Date('2026-08-07T14:30:00Z').getTime();

    expect(formatCountdown(deadline, now)).toBe('1d 2h 30m');
  });

  it('returns expired when the deadline has passed', () => {
    const now = new Date('2026-08-08T12:00:00Z').getTime();
    const deadline = new Date('2026-08-07T14:30:00Z').getTime();

    expect(formatCountdown(deadline, now)).toBe('Expired');
  });

  it('returns null for blank or null-like values', () => {
    expect(formatCountdown(null)).toBeNull();
    expect(formatCountdown('')).toBeNull();
    expect(formatCountdown('null')).toBeNull();
    expect(formatCountdown('None')).toBeNull();
  });

  it('returns a timer string for a valid deadline and null for no deadline', () => {
    const now = new Date('2026-08-06T12:00:00Z').getTime();
    const deadline = new Date('2026-08-07T14:30:00Z').getTime();

    expect(getCountdownText(null, now)).toBeNull();
    expect(getCountdownText(deadline, now)).toBe('1:02:30:00');
  });
});
