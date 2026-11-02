import { describe, expect, it } from 'vitest';
import { dateInputToISO, greeting, isOverdue, pct, toISODate } from '../utils/format.js';
import { categoryInfo, avatarEmoji } from '../utils/constants.js';

describe('format helpers', () => {
  it('toISODate uses the local calendar day', () => expect(toISODate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05'));
  it('dateInputToISO keeps the chosen calendar day regardless of timezone', () => {
    const d = new Date(dateInputToISO('2026-03-09'));
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 3, 9]);
  });
  it('pct clamps and handles zero', () => { expect(pct(5, 0)).toBe(0); expect(pct(3, 4)).toBe(75); expect(pct(9, 4)).toBe(100); });
  it('greeting depends on the hour', () => { expect(greeting(8)).toBe('Good morning'); expect(greeting(13)).toBe('Good afternoon'); expect(greeting(20)).toBe('Good evening'); });
  it('isOverdue only applies to open tasks past their due date', () => {
    const past = new Date(Date.now() - 3 * 864e5).toISOString();
    expect(isOverdue({ status: 'assigned', dueDate: past })).toBe(true);
    expect(isOverdue({ status: 'approved', dueDate: past })).toBe(false);
    expect(isOverdue({ status: 'assigned', dueDate: new Date(Date.now() + 864e5).toISOString() })).toBe(false);
  });
  it('category and avatar lookups fall back safely', () => { expect(categoryInfo('outdoor').label).toBe('Outdoor Adventures'); expect(categoryInfo('zzz').label).toBe('zzz'); expect(avatarEmoji('nope')).toBe('🌱'); });
});
