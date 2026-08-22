import { generateId } from '../idGenerator';

describe('idGenerator', () => {
    test('generates a string with timestamp and random entropy', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(10);
        expect(id).toMatch(/^\d+_[a-z0-9]+$/);
    });

    test('supports optional domain prefix', () => {
        const goalId = generateId('goal');
        expect(goalId).toMatch(/^goal_\d+_[a-z0-9]+$/);

        const tacticId = generateId('tactic');
        expect(tacticId).toMatch(/^tactic_\d+_[a-z0-9]+$/);
    });

    test('generates 10,000 unique IDs without a single collision in rapid synchronous loop', () => {
        const count = 10000;
        const set = new Set();

        for (let i = 0; i < count; i++) {
            const id = generateId();
            set.add(id);
        }

        expect(set.size).toBe(count);
    });
});
