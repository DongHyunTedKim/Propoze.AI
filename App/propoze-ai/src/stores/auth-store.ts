import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "next-auth";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: true,

      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (role) => {
        const { session } = get();
        if (!session?.user?.roles) return false;
        return session.user.roles.includes(role);
      },

      hasPermission: (permission) => {
        const { session } = get();
        if (!session?.user?.permissions) return false;
        return session.user.permissions.includes(permission);
      },

      hasAnyRole: (roles) => {
        const { session } = get();
        if (!session?.user?.roles) return false;
        return roles.some((role) => session.user.roles.includes(role));
      },

      hasAllRoles: (roles) => {
        const { session } = get();
        if (!session?.user?.roles) return false;
        return roles.every((role) => session.user.roles.includes(role));
      },

      hasAnyPermission: (permissions) => {
        const { session } = get();
        if (!session?.user?.permissions) return false;
        return permissions.some((permission) =>
          session.user.permissions.includes(permission)
        );
      },

      hasAllPermissions: (permissions) => {
        const { session } = get();
        if (!session?.user?.permissions) return false;
        return permissions.every((permission) =>
          session.user.permissions.includes(permission)
        );
      },

      clear: () => set({ session: null, isLoading: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ session: state.session }), // Only persist session
    }
  )
);
