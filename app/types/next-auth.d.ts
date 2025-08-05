// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      /** The user's unique ID */
      id: string;
      /** Their program role, e.g. "manager" | "startup" */
      role: string;
      /** Full name from your metadata */
      full_name: string;
    } & DefaultSession["user"];
  }

  // If you also use `user` callbacks:
  interface User extends DefaultUser {
    id: string;
    role: string;
    full_name: string;
  }
}
