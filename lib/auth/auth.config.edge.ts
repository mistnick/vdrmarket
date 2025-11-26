import type { NextAuthConfig } from "next-auth";

export const authConfigEdge: NextAuthConfig = {
    providers: [],
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    trustHost: true,
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
    },
    debug: process.env.NODE_ENV === "development",
};
