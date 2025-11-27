/**
 * Tests for User Status API (activate/deactivate users)
 */

import { NextRequest } from "next/server";

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

// Mock session
const mockSession = {
  email: "admin@example.com",
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn(() => Promise.resolve(mockSession)),
}));

jest.mock("@/lib/utils/audit-log", () => ({
  createAuditLog: jest.fn(() => Promise.resolve()),
}));

// Import after mocks
import { PATCH, GET } from "@/app/api/users/[userId]/status/route";

describe("User Status API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PATCH /api/users/[userId]/status", () => {
    it("should return 401 if not authenticated", async () => {
      const { getSession } = require("@/lib/auth/session");
      getSession.mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost:3000/api/users/user1/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "user1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if isActive is not a boolean", async () => {
      const request = new NextRequest("http://localhost:3000/api/users/user1/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: "false" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "user1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("isActive must be a boolean");
    });

    it("should return 404 if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest("http://localhost:3000/api/users/user1/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "user1" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return 400 if trying to deactivate self", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "admin-user-id",
          email: "target@example.com",
          teams: [],
        })
        .mockResolvedValueOnce({
          id: "admin-user-id",
          email: "admin@example.com",
          teams: [],
        });

      const request = new NextRequest("http://localhost:3000/api/users/admin-user-id/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "admin-user-id" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot change your own active status");
    });

    it("should successfully deactivate a user", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "target-user-id",
          email: "target@example.com",
          name: "Target User",
          teams: [
            {
              role: "member",
              team: {
                id: "team1",
                name: "Test Team",
                members: [
                  {
                    role: "owner",
                    userId: "admin-user-id",
                    user: { email: "admin@example.com" },
                  },
                  {
                    role: "member",
                    userId: "target-user-id",
                    user: { email: "target@example.com" },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          id: "admin-user-id",
          email: "admin@example.com",
          teams: [{ teamId: "team1" }],
        });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: "target-user-id",
        name: "Target User",
        email: "target@example.com",
        isActive: false,
        updatedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/users/target-user-id/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target-user-id" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isActive).toBe(false);
      expect(data.message).toBe("User deactivated successfully");
    });
  });

  describe("GET /api/users/[userId]/status", () => {
    it("should return user active status", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: "user1",
        isActive: true,
      });

      const request = new NextRequest("http://localhost:3000/api/users/user1/status");

      const response = await GET(request, { params: Promise.resolve({ userId: "user1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isActive).toBe(true);
    });
  });
});
