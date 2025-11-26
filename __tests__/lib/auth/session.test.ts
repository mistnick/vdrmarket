/**
 * Tests for Authentication Session Management
 */

import { createSession, getSession, deleteSession, generateSessionToken } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('next/headers');
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

describe('Session Management', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: null,
    password: 'hashed',
    passwordResetToken: null,
    passwordResetExpiry: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createSession', () => {
    it('should create a session and set cookie', async () => {
      const mockSession = {
        id: 'session-123',
        userId: mockUser.id,
        sessionToken: 'mock-token',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const mockCookies = {
        set: jest.fn(),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const token = await createSession(mockUser);

      expect(token).toBe('mock-token');
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
          }),
        })
      );
      expect(mockCookies.set).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should return session data from cookie if present', async () => {
      const mockSession = {
        id: 'session-123',
        userId: mockUser.id,
        sessionToken: 'valid-token',
        expires: new Date(Date.now() + 10000),
        user: mockUser,
      };

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const session = await getSession();

      expect(session).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        image: mockUser.image,
      });
    });

    it('should return session data from NextAuth if cookie missing', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const mockAuthSession = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          image: mockUser.image,
        },
      };

      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(mockAuthSession);

      const session = await getSession();

      expect(session).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        image: mockUser.image,
      });
    });

    it('should return null for missing session', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue(null);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it('should return null for session without user', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const { auth } = require('@/lib/auth');
      auth.mockResolvedValue({});

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session and clear cookie', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
        delete: jest.fn(),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      (prisma.session.delete as jest.Mock).mockResolvedValue({});

      await deleteSession();

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: 'valid-token' },
      });
      expect(mockCookies.delete).toHaveBeenCalled();
    });
  });
});
