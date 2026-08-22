import {
    toUTCDate,
    toDateString,
    getTodayString,
    getTodayUTC,
    getUTCDateString,
    daysBetween,
    weeksBetween,
    isDateInRange,
    addDays,
    getStartOfWeek,
} from '../dateHelpers';

describe('dateHelpers', () => {
    describe('toUTCDate & toDateString', () => {
        test('converts date string to UTC Date without timezone shift', () => {
            const d = toUTCDate('2026-08-22');
            expect(d.getUTCFullYear()).toBe(2026);
            expect(d.getUTCMonth()).toBe(7); // 0-indexed August
            expect(d.getUTCDate()).toBe(22);
            expect(d.getUTCHours()).toBe(0);
        });

        test('converts Date object back to YYYY-MM-DD string', () => {
            const d = new Date(Date.UTC(2026, 7, 22));
            expect(toDateString(d)).toBe('2026-08-22');
        });

        test('handles invalid inputs gracefully in toDateString', () => {
            expect(toDateString(null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(toDateString(new Date('invalid'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getTodayString & getTodayUTC', () => {
        test('returns valid YYYY-MM-DD string for today', () => {
            expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('returns midnight UTC date for today', () => {
            const today = getTodayUTC();
            expect(today.getUTCHours()).toBe(0);
            expect(today.getUTCMinutes()).toBe(0);
            expect(today.getUTCSeconds()).toBe(0);
        });
    });

    describe('addDays', () => {
        test('correctly adds days across month boundaries', () => {
            // August has 31 days
            expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
            expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); // 2026 is non-leap year
        });

        test('correctly subtracts days when given negative number', () => {
            expect(addDays('2026-09-02', -3)).toBe('2026-08-30');
            expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
        });
    });

    describe('daysBetween & weeksBetween', () => {
        test('computes inclusive day count', () => {
            expect(daysBetween('2026-08-01', '2026-08-01')).toBe(1);
            expect(daysBetween('2026-08-01', '2026-08-07')).toBe(7);
        });

        test('computes rounded-up week count', () => {
            expect(weeksBetween('2026-08-01', '2026-08-07')).toBe(1);
            expect(weeksBetween('2026-08-01', '2026-08-08')).toBe(1);
            expect(weeksBetween('2026-08-01', '2026-08-15')).toBe(2);
        });
    });

    describe('isDateInRange', () => {
        test('checks date containment correctly (inclusive boundaries)', () => {
            const start = '2026-08-10';
            const end = '2026-08-20';
            expect(isDateInRange(toUTCDate('2026-08-10'), start, end)).toBe(true);
            expect(isDateInRange(toUTCDate('2026-08-15'), start, end)).toBe(true);
            expect(isDateInRange(toUTCDate('2026-08-20'), start, end)).toBe(true);
            expect(isDateInRange(toUTCDate('2026-08-09'), start, end)).toBe(false);
            expect(isDateInRange(toUTCDate('2026-08-21'), start, end)).toBe(false);
        });
    });

    describe('getStartOfWeek', () => {
        test('finds preceding Monday for any weekday', () => {
            // Wednesday Aug 19, 2026 -> Monday is Aug 17, 2026
            const wed = new Date(Date.UTC(2026, 7, 19));
            const mon = getStartOfWeek(wed);
            expect(toDateString(mon)).toBe('2026-08-17');
        });

        test('returns same day if given date is already Monday', () => {
            // Monday Aug 17, 2026
            const monInput = new Date(Date.UTC(2026, 7, 17));
            const mon = getStartOfWeek(monInput);
            expect(toDateString(mon)).toBe('2026-08-17');
        });

        test('finds preceding Monday for Sunday (handles week wrap)', () => {
            // Sunday Aug 23, 2026 -> Monday is Aug 17, 2026
            const sun = new Date(Date.UTC(2026, 7, 23));
            const mon = getStartOfWeek(sun);
            expect(toDateString(mon)).toBe('2026-08-17');
        });
    });
});
