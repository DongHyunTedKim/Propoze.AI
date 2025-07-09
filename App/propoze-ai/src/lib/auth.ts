import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { getUserRoles, getUserPermissions } from "./auth/rbac";
import { createClient } from "./supabase/server";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = await createClient();

        // Find user by email
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) {
          return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password_hash || ""
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/login-idpw",
    error: "/auth/login-idpw",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        account?.provider === "google" ||
        account?.provider === "github" ||
        account?.provider === "kakao"
      ) {
        const supabase = await createClient();

        // Check if user exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          // Create new user for OAuth
          const { data: newUser, error } = await supabase
            .from("users")
            .insert({
              email: user.email,
              name: user.name,
              provider: account.provider,
              provider_id: account.providerAccountId,
            })
            .select()
            .single();

          if (error) {
            console.error("OAuth user creation error:", error);
            return false;
          }

          // Assign default 'user' role
          const { data: roleData } = await supabase
            .from("roles")
            .select("id")
            .eq("name", "user")
            .single();

          if (roleData) {
            await supabase.from("user_roles").insert({
              user_id: newUser.id,
              role_id: roleData.id,
            });
          }

          user.id = newUser.id;
        } else {
          user.id = existingUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;

        // Get user roles and permissions
        const roles = await getUserRoles(user.id);
        const permissions = await getUserPermissions(user.id);

        token.roles = roles.map((r) => r.name);
        token.permissions = permissions.map((p) => `${p.resource}:${p.action}`);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.roles = token.roles as string[];
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
      permissions: string[];
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    provider?: string;
    providerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles: string[];
    permissions: string[];
  }
}
