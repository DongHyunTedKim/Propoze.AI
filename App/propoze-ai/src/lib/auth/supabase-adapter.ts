import { Adapter } from "next-auth/adapters";
import { createClient } from "@/lib/supabase/server";

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(user) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("users")
        .insert({
          email: user.email,
          name: user.name,
          provider: null, // OAuth 정보는 linkAccount에서 처리
          provider_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      // Assign default 'user' role
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "user")
        .single();

      if (roleData) {
        await supabase.from("user_roles").insert({
          user_id: data.id,
          role_id: roleData.id,
        });
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: null,
        image: null,
      };
    },

    async getUser(id) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: null,
        image: null,
      };
    },

    async getUserByEmail(email) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: null,
        image: null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("provider", provider)
        .eq("provider_id", providerAccountId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: null,
        image: null,
      };
    },

    async updateUser(user) {
      const supabase = await createClient();

      const updateData: any = {};
      if (user.email) updateData.email = user.email;
      if (user.name) updateData.name = user.name;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        emailVerified: null,
        image: null,
      };
    },

    async linkAccount(account) {
      const supabase = await createClient();

      // Update user with OAuth provider info
      const { error } = await supabase
        .from("users")
        .update({
          provider: account.provider,
          provider_id: account.providerAccountId,
        })
        .eq("id", account.userId);

      if (error) throw error;

      return account;
    },

    async createSession({ sessionToken, userId, expires }) {
      // Using JWT strategy, so sessions are not stored in DB
      return {
        sessionToken,
        userId,
        expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      // Using JWT strategy, so sessions are not stored in DB
      return null;
    },

    async updateSession({ sessionToken }) {
      // Using JWT strategy, so sessions are not stored in DB
      return null;
    },

    async deleteSession(sessionToken) {
      // Using JWT strategy, so sessions are not stored in DB
      return;
    },

    async createVerificationToken({ identifier, token, expires }) {
      // Not implemented for now
      return null as any;
    },

    async useVerificationToken({ identifier, token }) {
      // Not implemented for now
      return null;
    },
  };
}
