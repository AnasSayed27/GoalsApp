import { StorageService } from '../StorageService';

describe('StorageService', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await StorageService.clearAll();
    });

    test('get, save, and remove work as expected', async () => {
        await StorageService.save('test_key', { a: 1 });
        const result = await StorageService.get('test_key');
        expect(result).toEqual({ a: 1 });

        await StorageService.remove('test_key');
        const empty = await StorageService.get('test_key', 'fallback');
        expect(empty).toBe('fallback');
    });

    test('mutate handles sequential updates correctly', async () => {
        await StorageService.save('counter', 0);

        await StorageService.mutate('counter', (val) => val + 1, 0);
        await StorageService.mutate('counter', (val) => val + 5, 0);

        const result = await StorageService.get('counter');
        expect(result).toBe(6);
    });

    test('mutate guarantees zero lost updates during concurrent asynchronous executions', async () => {
        await StorageService.save('concurrent_counter', 0);

        const increments = 25;
        // Fire 25 concurrent mutate calls without awaiting individually
        const promises = Array.from({ length: increments }).map(async (_, idx) => {
            return StorageService.mutate('concurrent_counter', async (val) => {
                // Simulate variable network/IO delay
                await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 20) + 5));
                return (val || 0) + 1;
            }, 0);
        });

        await Promise.all(promises);

        const finalCounter = await StorageService.get('concurrent_counter');
        expect(finalCounter).toBe(increments); // Must be exactly 25, no lost increments!
    });
});
