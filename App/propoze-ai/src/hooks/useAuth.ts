"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  role?: string;
  permission?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status } = useSession({
    required: options.required,
  });
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (!isLoading && options.required && !isAuthenticated) {
      router.push(options.redirectTo || "/auth/login-idpw");
    }
  }, [
    isLoading,
    isAuthenticated,
    options.required,
    options.redirectTo,
    router,
  ]);

  const hasRole = (role: string): boolean => {
    if (!session?.user?.roles) return false;
    return session.user.roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!session?.user?.permissions) return false;
    return session.user.permissions.includes(permission);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!session?.user?.roles) return false;
    return roles.some((role) => session.user.roles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!session?.user?.roles) return false;
    return roles.every((role) => session.user.roles.includes(role));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!session?.user?.permissions) return false;
    return permissions.some((permission) =>
      session.user.permissions.includes(permission)
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!session?.user?.permissions) return false;
    return permissions.every((permission) =>
      session.user.permissions.includes(permission)
    );
  };

  // Check role/permission requirements
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (options.role && !hasRole(options.role)) {
        router.push("/403");
      }
      if (options.permission && !hasPermission(options.permission)) {
        router.push("/403");
      }
    }
  }, [isLoading, isAuthenticated, options.role, options.permission]);

  return {
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
  };
}
