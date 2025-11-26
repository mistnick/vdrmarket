import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  providers: [
    // Credentials Provider (Email + Password)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH DEBUG] Starting authorization with credentials:', { email: credentials?.email });

          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.log('[AUTH DEBUG] Validation failed:', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;
          console.log('[AUTH DEBUG] Validated fields:', { email });

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          console.log('[AUTH DEBUG] User found:', user ? `Yes (${user.email})` : 'No');

          if (!user || !user.password) {
            console.log('[AUTH DEBUG] User not found or no password');
            return null;
          }

          console.log('[AUTH DEBUG] Comparing passwords...');
          const passwordsMatch = await bcrypt.compare(password, user.password);
          console.log('[AUTH DEBUG] Password match:', passwordsMatch);

          if (!passwordsMatch) {
            console.log('[AUTH DEBUG] Password mismatch');
            return null;
          }

          console.log('[AUTH DEBUG] Authorization successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("[AUTH DEBUG] Authorization error:", error);
          return null;
        }
      },
    }),

    // OAuth Providers - conditionally loaded based on environment variables
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),

    // Microsoft Azure AD Provider
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? [
        AzureADProvider({
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          authorization: {
            params: {
              scope: "openid profile email User.Read",
            },
          },
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),

    // Keycloak Provider (using generic OIDC)
    ...(process.env.KEYCLOAK_ISSUER &&
      process.env.KEYCLOAK_CLIENT_ID &&
      process.env.KEYCLOAK_CLIENT_SECRET
      ? [
        {
          id: "keycloak",
          name: "Keycloak",
          type: "oidc" as const,
          issuer: process.env.KEYCLOAK_ISSUER,
          clientId: process.env.KEYCLOAK_CLIENT_ID,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
          authorization: {
            params: {
              scope: "openid email profile",
            },
          },
          profile(profile: any) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            };
          },
          allowDangerousEmailAccountLinking: true,
        },
      ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('[AUTH DEBUG] signIn callback:', { userId: user.id, provider: account?.provider });
      // For OAuth providers, ensure user exists in database
      if (account?.provider === "keycloak" || account?.provider === "google" || account?.provider === "azure-ad") {
        if (user.email) {
          try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (!existingUser) {
              console.log('[AUTH DEBUG] Creating new user for OAuth login:', user.email);
              // Create new user from OAuth profile
              const newUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || "",
                  image: user.image || "",
                  emailVerified: new Date(), // OAuth providers verify email
                },
              });

              // Update user.id to the new database ID
              user.id = newUser.id;
            } else {
              // Use existing user ID
              user.id = existingUser.id;
            }
          } catch (error) {
            console.error("Error creating/finding user:", error);
            return false;
          }
        }
      }

      // Log sign-in for audit trail
      if (user && user.id) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "USER_LOGIN",
              resourceType: "USER",
              resourceId: user.id,
              metadata: {
                provider: account?.provider || "credentials",
              },
            },
          });
        } catch (error) {
          console.error("Error creating audit log:", error);
        }
      }

      return true;
    },
  },
  events: {
    async signOut(message) {
      // Log sign-out for audit trail
      const token = "token" in message ? message.token : null;
      if (token?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: token.id as string,
              action: "USER_LOGOUT",
              resourceType: "USER",
              resourceId: token.id as string,
              metadata: {},
            },
          });
        } catch (error) {
          console.error("Error creating audit log:", error);
        }
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};
