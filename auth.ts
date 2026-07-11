import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) return null;

        const valid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          credits: user.credits,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, user object is available — persist fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.credits = user.credits;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.credits = token.credits as number;
      }
      return session;
    },
  },
});