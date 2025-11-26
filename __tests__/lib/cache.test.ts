import { cacheService } from "@/lib/redis/cache.service";

// Mock Redis client
jest.mock("@/lib/redis/client", () => ({
  getRedisClientSafe: jest.fn(() => null),
}));

describe("CacheService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle get when Redis is unavailable", async () => {
    const result = await cacheService.get("test-key");
    expect(result).toBeNull();
  });

  it("should handle set when Redis is unavailable", async () => {
    const result = await cacheService.set("test-key", { data: "test" });
    expect(result).toBe(false);
  });

  it("should handle delete when Redis is unavailable", async () => {
    const result = await cacheService.delete("test-key");
    expect(result).toBe(false);
  });

  it("should handle getOrSet when Redis is unavailable", async () => {
    const fetchFn = jest.fn(async () => ({ data: "test" }));
    const result = await cacheService.getOrSet("test-key", fetchFn);

    expect(fetchFn).toHaveBeenCalled();
    expect(result).toEqual({ data: "test" });
  });
});
