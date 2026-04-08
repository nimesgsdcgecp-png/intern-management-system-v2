import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getUserByEmail, getUserById } from "./db";

export const authOptions: NextAuthOptions = {
  providers:
    [
      CredentialsProvider(
        {
          name: "Credentials",
          credentials: {
            identifier: { label: "User ID or Email", type: "text" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            if (!credentials?.identifier || !credentials?.password) {
              console.log("❌ Missing credentials");
              return null;
            }

            const identifier = String(credentials.identifier).trim();
            const user = identifier.includes("@")
              ? await getUserByEmail(identifier)
              : await getUserById(identifier);

            if (!user) {
              console.log("❌ User not found");
              return null;
            }

            const passwordMatch = await compare(
              credentials.password as string,
              user.password || ""
            );

            if (!passwordMatch) {
              return null;
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department || "",
              departmentId: user.departmentId || "",
            };
          },
        }
      ),
    ],

  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.department = user.department;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.department = token.department;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function auth() {
  return getServerSession(authOptions);
}


