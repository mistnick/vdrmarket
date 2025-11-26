import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { apiLimiter, authLimiter, getClientIp, rateLimit } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
    describe('getClientIp', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '192.168.1.1, 10.0.0.1',
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe('192.168.1.1');
        });

        it('should extract IP from x-real-ip header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-real-ip': '192.168.1.1',
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe('192.168.1.1');
        });

        it('should return unknown if no IP headers present', () => {
            const request = new Request('http://localhost');
            const ip = getClientIp(request);
            expect(ip).toBe('unknown');
        });

        it('should prefer x-forwarded-for over x-real-ip', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    'x-real-ip': '10.0.0.1',
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe('192.168.1.1');
        });
    });

    describe('Rate Limiter', () => {
        beforeEach(() => {
            // Clean up the rate limiter between tests
            apiLimiter.cleanup();
            authLimiter.cleanup();
        });

        it('should allow requests within limit', async () => {
            const result = await apiLimiter.check(10, 'test-token');
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(9);
        });

        it('should block requests exceeding limit', async () => {
            const token = 'test-token-2';

            // Make requests up to the limit
            for (let i = 0; i < 10; i++) {
                await apiLimiter.check(10, token);
            }

            // Next request should be blocked
            const result = await apiLimiter.check(10, token);
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should reset after time window', async () => {
            jest.useFakeTimers();
            const token = 'test-token-3';

            // Use up the limit
            for (let i = 0; i < 10; i++) {
                await apiLimiter.check(10, token);
            }

            // Should be blocked
            let result = await apiLimiter.check(10, token);
            expect(result.success).toBe(false);

            // Advance time past the window (1 minute)
            jest.advanceTimersByTime(61 * 1000);

            // Should be allowed again
            result = await apiLimiter.check(10, token);
            expect(result.success).toBe(true);

            jest.useRealTimers();
        });

        it('should track separate tokens independently', async () => {
            const result1 = await apiLimiter.check(5, 'token-1');
            const result2 = await apiLimiter.check(5, 'token-2');

            expect(result1.remaining).toBe(4);
            expect(result2.remaining).toBe(4);
        });
    });

    describe('rateLimit helper', () => {
        it('should rate limit based on IP address', async () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '192.168.1.100',
                },
            });

            const result = await rateLimit(request, apiLimiter, 10);
            expect(result.success).toBe(true);
            expect(result.limit).toBe(10);
        });
    });

    describe('Auth Limiter', () => {
        it('should have stricter limits for auth', async () => {
            const token = 'auth-test';

            // Auth limiter should have a longer window (15 minutes)
            const result = await authLimiter.check(5, token);

            expect(result.success).toBe(true);
            expect(result.reset).toBeGreaterThan(Date.now());
        });
    });
});
