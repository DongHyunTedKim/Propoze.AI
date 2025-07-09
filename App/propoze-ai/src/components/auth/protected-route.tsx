"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: string;
  permission?: string;
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean; // true: AND 조건, false: OR 조건 (기본값)
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  role,
  permission,
  roles,
  permissions,
  requireAll = false,
  fallback,
  redirectTo = "/403",
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    hasAllRoles,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
  } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // 인증되지 않은 경우
      if (!isAuthenticated) {
        router.push("/auth/login-idpw");
        return;
      }

      let authorized = true;

      // 단일 역할 체크
      if (role) {
        authorized = authorized && hasRole(role);
      }

      // 단일 권한 체크
      if (permission) {
        authorized = authorized && hasPermission(permission);
      }

      // 다중 역할 체크
      if (roles && roles.length > 0) {
        authorized =
          authorized && (requireAll ? hasAllRoles(roles) : hasAnyRole(roles));
      }

      // 다중 권한 체크
      if (permissions && permissions.length > 0) {
        authorized =
          authorized &&
          (requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions));
      }

      if (!authorized) {
        router.push(redirectTo);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    role,
    permission,
    roles,
    permissions,
    requireAll,
    hasRole,
    hasPermission,
    hasAllRoles,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
    router,
    redirectTo,
  ]);

  // 로딩 중
  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      )
    );
  }

  // 인증되지 않았거나 권한이 없는 경우
  if (!isAuthenticated || !isAuthorized) {
    return fallback || null;
  }

  return <>{children}</>;
}
