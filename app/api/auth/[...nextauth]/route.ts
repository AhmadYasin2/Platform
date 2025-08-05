// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, DefaultSession, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

// 1) Augment the JWT payload to include `role` and `sub`
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sub?: string;
  }
}

// 2) Augment the Session object so `session.user.id` & `session.user.role` exist
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  // --------------------
  // Providers
  // --------------------
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // 1. Lookup user  full_name via profiles
        const { rows } = await pool.query<{
          id: string;
          email: string;
          password_hash: string;
          role: string;
          full_name: string | null;
        }>(
          `SELECT u.id, u.email, u.password_hash, u.role, p.full_name
           FROM users u
           LEFT JOIN profiles p ON p.id = u.id
           WHERE u.email = $1`,
          [credentials.email]
        );
        const user = rows[0];
        if (!user) return null;

        // 2. Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!isValid) return null;

        // 3. Return object that gets encoded into the JWT (including full_name)
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name ?? "",
        };
      },
    }),
  ],

  // --------------------
  // Session Strategy
  // --------------------
  session: {
    strategy: "jwt", // <-- literal type
  },

  // --------------------
  // Callbacks
  // --------------------
  callbacks: {
    // Fired whenever a JWT is created or updated
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },

    // Fired whenever a session is checked
    async session({ session, token }): Promise<Session> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      session.user.id = token.sub!;
      session.user.role = token.role;
      return session;
    },
  },

  // --------------------
  // Custom Pages (optional)
  // --------------------
  pages: {
    signIn: "/auth/signin",
  },
};

// Next.js 13 route handler export
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
